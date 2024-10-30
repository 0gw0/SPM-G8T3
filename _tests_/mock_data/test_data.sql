-- Reset test data
DELETE FROM arrangements WHERE id IN (261, 262, 263, 266);
DELETE FROM employees WHERE id = 140001;

-- Create test employee
INSERT INTO employees (id, email, name, department)
VALUES (140001, 'derek.tan@example.com', 'Derek Tan', 'Engineering');

-- Create arrangements for different test cases
INSERT INTO arrangements (id, employee_id, status, withdrawal_status, created_at)
VALUES 
    (263, 140001, 'pending', NULL, CURRENT_TIMESTAMP),         -- TC-001: New arrangement
    (266, 140001, 'approved', NULL, CURRENT_TIMESTAMP),        -- TC-002: Withdrawal request
    (262, 140001, 'pending', NULL, CURRENT_TIMESTAMP),         -- TC-003/004: Status update
    (261, 140001, 'approved', 'pending', CURRENT_TIMESTAMP);   -- TC-005/006: Withdrawal status update