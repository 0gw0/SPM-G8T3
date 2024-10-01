const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function capitalizeWords(string) {
    return string
        .split(' ')
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
}

function separateNames(name) {
    return name.replace(/([a-z])([A-Z])|(\d)([A-Za-z])/g, '$1$3 $2$4').trim();
}

function removeSpaces(string) {
    return string.replace(/\s+/g, '');
}

function cleanEmail(email, fname, lname) {
    email = email.trim().toLowerCase();
    const [localPart, domain] = email.split('@');
    const expectedLocalPart =
        `${fname.toLowerCase()}.${lname.toLowerCase()}`.replace(/\s+/g, '');

    if (localPart !== expectedLocalPart || !email.includes('@')) {
        return `${expectedLocalPart}@${domain || 'allinone.com.sg'}`;
    }

    return email;
}

function cleanData(row) {
    const originalRow = { ...row };
    const changes = {};
    const cleanedRow = {};

    // Convert all keys to lowercase
    Object.keys(row).forEach((key) => {
        const lowerKey = key.toLowerCase();
        cleanedRow[lowerKey] = row[key];
    });

    // Clean and format names
    ['staff_fname', 'staff_lname'].forEach((field) => {
        const separated = separateNames(cleanedRow[field]);
        const cleaned = capitalizeWords(separated.trim().replace(/\s+/g, ' '));
        if (cleanedRow[field] !== cleaned) {
            changes[field] = { from: cleanedRow[field], to: cleaned };
            cleanedRow[field] = cleaned;
        }
    });

    // Clean and format email
    const cleanedEmail = cleanEmail(
        cleanedRow.email,
        cleanedRow.staff_fname,
        cleanedRow.staff_lname
    );
    if (cleanedRow.email !== cleanedEmail) {
        changes.email = { from: cleanedRow.email, to: cleanedEmail };
        cleanedRow.email = cleanedEmail;
    }

    // Handle country-specific domain
    const countryDomains = {
        singapore: 'com.sg',
        malaysia: 'com.my',
        indonesia: 'co.id',
        vietnam: 'com.vn',
        'hong kong': 'com.hk',
    };

    const [, domain] = cleanedRow.email.split('@');
    const countryDomain = countryDomains[cleanedRow.country.toLowerCase()];
    if (countryDomain && !domain.endsWith(countryDomain)) {
        const newEmail = `${
            cleanedRow.email.split('@')[0]
        }@allinone.${countryDomain}`;
        changes.email = { from: cleanedRow.email, to: newEmail };
        cleanedRow.email = newEmail;
    }

    // Convert staff_id, reporting_manager, and role to integers
    ['staff_id', 'reporting_manager', 'role'].forEach((field) => {
        const parsed = parseInt(cleanedRow[field]);
        if (!isNaN(parsed) && cleanedRow[field] !== parsed.toString()) {
            changes[field] = { from: cleanedRow[field], to: parsed };
            cleanedRow[field] = parsed;
        }
    });

    return {
        cleanedRow,
        changes: Object.keys(changes).length > 0 ? changes : null,
    };
}

async function uploadToSupabase(cleanedData) {
    try {
        const { data, error } = await supabase
            .from('employee')
            .upsert(cleanedData, { onConflict: 'staff_id' });

        if (error) {
            throw error;
        }
        console.log('Data successfully uploaded to Supabase');
    } catch (error) {
        console.error('Error uploading to Supabase:', error.message);
        throw error;
    }
}

const cleanedData = [];
const changeLog = [];

async function processCSVAndUpload() {
    return new Promise((resolve, reject) => {
        fs.createReadStream('employeenew.csv')
            .pipe(csv())
            .on('data', (row) => {
                const { cleanedRow, changes } = cleanData(row);
                cleanedData.push(cleanedRow);
                if (changes) {
                    changeLog.push({ staff_id: cleanedRow.staff_id, changes });
                }
            })
            .on('end', async () => {
                console.log('CSV file successfully processed');

                fs.writeFileSync(
                    'cleaned_data.json',
                    JSON.stringify(cleanedData, null, 2)
                );
                console.log(
                    `Cleaned data saved to cleaned_data.json (${cleanedData.length} rows)`
                );

                fs.writeFileSync(
                    'change_log.json',
                    JSON.stringify(changeLog, null, 2)
                );
                console.log(
                    `Change log saved to change_log.json (${changeLog.length} changed rows)`
                );

                try {
                    await uploadToSupabase(cleanedData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Main execution
processCSVAndUpload()
    .then(() => {
        console.log('Process completed successfully');
    })
    .catch((error) => {
        console.error('An error occurred during the process:', error.message);
        process.exit(1);
    });
