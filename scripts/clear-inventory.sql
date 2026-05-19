-- Clear all inventory items
DELETE FROM inventory;

-- Show result
SELECT COUNT(*) as remaining_items FROM inventory;

-- Show message
SELECT 'All inventory items deleted successfully' as message;

-- Made with Bob
