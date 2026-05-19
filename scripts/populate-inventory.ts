import prisma from '../src/db/index.js';

const inventoryData = [
  { id: 'MND-001', name: 'Ant Esports Wolf Mouse Pad', quantity: 1, digitalFallbackPoints: 104 },
  { id: 'MND-002', name: 'Portronics Toad 8 Transparent Wireless Bluetooth Mouse', quantity: 2, digitalFallbackPoints: 612 },
  { id: 'MND-003', name: 'Tygot Bluetooth Selfie Stick Tripod', quantity: 1, digitalFallbackPoints: 256 },
  { id: 'MND-004', name: 'Portronics Toad 23 Wireless Mouse', quantity: 1, digitalFallbackPoints: 269 },
  { id: 'MND-005', name: 'Portronics Swipe 2 Screen Cleaner', quantity: 1, digitalFallbackPoints: 119 },
  { id: 'MND-006', name: 'Portronics Bubble 3.0 Wireless Keyboard', quantity: 1, digitalFallbackPoints: 899 },
  { id: 'MND-007', name: 'Lapster 5-in-1 Cleaning Kit', quantity: 1, digitalFallbackPoints: 99 },
  { id: 'MND-008', name: 'pTron Fusion Tunes Bluetooth Speaker', quantity: 1, digitalFallbackPoints: 760 },
  { id: 'MND-009', name: 'THEMISTO Precision Screwdriver Set', quantity: 1, digitalFallbackPoints: 255 },
  { id: 'MND-010', name: 'Zebronics Transformer Gaming Mouse', quantity: 1, digitalFallbackPoints: 549 },
  { id: 'MND-011', name: 'GZRC Thug Life Party Sunglasses', quantity: 2, digitalFallbackPoints: 47 },
  { id: 'MND-012', name: 'KiKiluxxa Glass Travel Sipper Mug', quantity: 1, digitalFallbackPoints: 279 },
  { id: 'MND-013', name: 'Ambrane 60W Type-C Cable', quantity: 1, digitalFallbackPoints: 141 },
  { id: 'MND-014', name: 'Portronics Snapcase 2 Cable Kit', quantity: 1, digitalFallbackPoints: 449 },
  { id: 'MND-015', name: 'Ambrane MagSafe 10000mAh Power Bank', quantity: 1, digitalFallbackPoints: 1299 },
  { id: 'MND-016', name: 'Toy Imagine Kids Digital Camera', quantity: 1, digitalFallbackPoints: 550 },
  { id: 'MND-017', name: 'Storio Rechargeable Retro Game Console', quantity: 1, digitalFallbackPoints: 551 },
  { id: 'MND-018', name: 'Blaze Storm Soft Bullet Gun Toy', quantity: 1, digitalFallbackPoints: 174 },
  { id: 'MND-019', name: 'Ant Esports MK3400 Mechanical Keyboard', quantity: 1, digitalFallbackPoints: 1329 },
  { id: 'MND-020', name: 'Ant Esports GP300 Gaming Controller', quantity: 1, digitalFallbackPoints: 1329 },
  { id: 'MND-021', name: 'Portronics Snapcase 3 Cable Kit', quantity: 1, digitalFallbackPoints: 245 },
  { id: 'MND-022', name: 'Fitness Mantra Sports Socks', quantity: 12, digitalFallbackPoints: 16 },
  { id: 'MND-023', name: 'Seagull Gadget Organizer Case', quantity: 1, digitalFallbackPoints: 399 },
  { id: 'MND-024', name: 'Gizga Pro 3-in-1 Cleaning Kit', quantity: 3, digitalFallbackPoints: 125 },
  { id: 'MND-025', name: 'DesiDiya DIY Infinity Mirror Tulip Cube LED Lamp', quantity: 1, digitalFallbackPoints: 209 },
  { id: 'MND-026', name: 'Billebon Premium Neck Pillow (Black)', quantity: 3, digitalFallbackPoints: 223 },
  { id: 'MND-027', name: 'Iris Lavender Fragrance Ceramic Vaporizer Set', quantity: 3, digitalFallbackPoints: 249 },
  { id: 'MND-028', name: 'EKAM Reed Diffuser Gift Set', quantity: 3, digitalFallbackPoints: 249 },
  { id: 'MND-029', name: 'Real Fruit Power Mixed Fruit Juice', quantity: 1, digitalFallbackPoints: 18 },
  { id: 'MND-030', name: 'Bingo Tedhe Medhe Masala Tadka', quantity: 1, digitalFallbackPoints: 16 },
  { id: 'MND-031', name: '7UP Nimbooz with Lemon Juice', quantity: 1, digitalFallbackPoints: 25 },
  { id: 'MND-032', name: 'Kurkure Puffcorn Cheese Snacks', quantity: 1, digitalFallbackPoints: 20 },
  { id: 'MND-033', name: 'Harpic Drain Xpert Cleaning Powder', quantity: 2, digitalFallbackPoints: 32 },
  { id: 'MND-034', name: 'Doritos Nachos Sweet Chilli', quantity: 1, digitalFallbackPoints: 36 },
  { id: 'MND-035', name: 'Lay\'s Chile Limon Chips', quantity: 1, digitalFallbackPoints: 25 },
  { id: 'MND-036', name: 'ACT II Classic Salted Popcorn', quantity: 1, digitalFallbackPoints: 10 },
  { id: 'MND-037', name: 'Colgate Sensitive Toothbrush', quantity: 1, digitalFallbackPoints: 56 },
  { id: 'MND-038', name: 'Paper Boat Mixed Berries Drink', quantity: 1, digitalFallbackPoints: 39 },
  { id: 'MND-039', name: 'Lay\'s Magic Masala Chips', quantity: 1, digitalFallbackPoints: 36 },
  { id: 'MND-040', name: 'Bingo Chilli Sprinkled Chips', quantity: 1, digitalFallbackPoints: 19 },
  { id: 'MND-041', name: 'Bingo Mad Angles Achaari Masti', quantity: 1, digitalFallbackPoints: 19 },
  { id: 'MND-042', name: 'ACT II Golden Sizzle Popcorn', quantity: 1, digitalFallbackPoints: 10 },
  { id: 'MND-043', name: 'Billebon Premium Neck Pillow (Grey)', quantity: 1, digitalFallbackPoints: 223 },
  { id: 'MND-044', name: 'Lay\'s Sizzling Hot Chips', quantity: 1, digitalFallbackPoints: 20 },
  { id: 'MND-045', name: 'Paper Boat Aam Panna Drink', quantity: 2, digitalFallbackPoints: 36 },
  { id: 'MND-046', name: 'ACT II Tomato Chilli Popcorn', quantity: 1, digitalFallbackPoints: 26 },
  { id: 'MND-047', name: 'Cheetos Masala Balls', quantity: 1, digitalFallbackPoints: 31 },
  { id: 'MND-048', name: 'Tropicana Pomegranate Delight Juice', quantity: 2, digitalFallbackPoints: 30 },
  { id: 'MND-049', name: 'DesiDiya Universe Crystal Ball LED Lamp', quantity: 3, digitalFallbackPoints: 179 },
  { id: 'MND-050', name: 'Clean Champ Flush Matic Pouch', quantity: 2, digitalFallbackPoints: 90 },
  { id: 'MND-051', name: 'Paper Boat Lychee Drink', quantity: 2, digitalFallbackPoints: 39 },
  { id: 'MND-052', name: 'Paper Boat Mango Drink', quantity: 1, digitalFallbackPoints: 39 },
  { id: 'MND-053', name: 'Sensodyne Sensitive Toothbrush', quantity: 3, digitalFallbackPoints: 65 },
  { id: 'MND-054', name: 'Quace Crystal Rain Drop String Light', quantity: 1, digitalFallbackPoints: 199 },
  { id: 'MND-055', name: 'Shri Samriddhi Toilet Cleaner Brush', quantity: 2, digitalFallbackPoints: 59 },
  { id: 'MND-056', name: 'ACT II Butter Delite Popcorn', quantity: 3, digitalFallbackPoints: 35 },
  { id: 'MND-057', name: 'Oral-B Pro Clean Sensitive Toothbrush', quantity: 6, digitalFallbackPoints: 50 },
  { id: 'MND-058', name: 'Lay\'s West Indies Hot \'n\' Sweet Chilli Chips', quantity: 1, digitalFallbackPoints: 25 },
  { id: 'MND-059', name: 'SaleOn Tech Pouch Organizer', quantity: 1, digitalFallbackPoints: 298 },
];

async function populateInventory() {
  console.log('Starting inventory population...');
  
  for (const item of inventoryData) {
    await prisma.inventory.upsert({
      where: { id: item.id },
      update: item,
      create: item
    });
    console.log(`✓ ${item.id}: ${item.name} (Qty: ${item.quantity})`);
  }
  
  console.log(`\n✅ Successfully populated ${inventoryData.length} items!`);
  
  // Show summary
  const totalItems = inventoryData.length;
  const inStock = inventoryData.filter(i => i.quantity > 0).length;
  const outOfStock = inventoryData.filter(i => i.quantity === 0).length;
  const totalQuantity = inventoryData.reduce((sum, i) => sum + i.quantity, 0);
  
  console.log('\n📊 Inventory Summary:');
  console.log(`   Total Items: ${totalItems}`);
  console.log(`   In Stock: ${inStock}`);
  console.log(`   Out of Stock: ${outOfStock}`);
  console.log(`   Total Quantity: ${totalQuantity} units`);
  
  await prisma.$disconnect();
}

populateInventory().catch(console.error);

// Made with Bob
