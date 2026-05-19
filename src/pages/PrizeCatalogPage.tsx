import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gift, Sparkles } from 'lucide-react';

interface Prize {
  id: string;
  name: string;
}

// Complete prize list from inventory
const PRIZE_LIST: Prize[] = [
  { id: 'MND-001', name: 'Ant Esports Wolf Mouse Pad' },
  { id: 'MND-002', name: 'Portronics Toad 8 Transparent Wireless Bluetooth Mouse' },
  { id: 'MND-003', name: 'Tygot Bluetooth Selfie Stick Tripod' },
  { id: 'MND-004', name: 'Portronics Toad 23 Wireless Mouse' },
  { id: 'MND-005', name: 'Portronics Swipe 2 Screen Cleaner' },
  { id: 'MND-006', name: 'Portronics Bubble 3.0 Wireless Keyboard' },
  { id: 'MND-007', name: 'Lapster 5-in-1 Cleaning Kit' },
  { id: 'MND-008', name: 'pTron Fusion Tunes Bluetooth Speaker' },
  { id: 'MND-009', name: 'THEMISTO Precision Screwdriver Set' },
  { id: 'MND-010', name: 'Zebronics Transformer Gaming Mouse' },
  { id: 'MND-011', name: 'GZRC Thug Life Party Sunglasses' },
  { id: 'MND-012', name: 'KiKiluxxa Glass Travel Sipper Mug' },
  { id: 'MND-013', name: 'Ambrane 60W Type-C Cable' },
  { id: 'MND-014', name: 'Portronics Snapcase 2 Cable Kit' },
  { id: 'MND-015', name: 'Ambrane MagSafe 10000mAh Power Bank' },
  { id: 'MND-016', name: 'Toy Imagine Kids Digital Camera' },
  { id: 'MND-017', name: 'Storio Rechargeable Retro Game Console' },
  { id: 'MND-018', name: 'Blaze Storm Soft Bullet Gun Toy' },
  { id: 'MND-019', name: 'Ant Esports MK3400 Mechanical Keyboard' },
  { id: 'MND-020', name: 'Ant Esports GP300 Gaming Controller' },
  { id: 'MND-021', name: 'Portronics Snapcase 3 Cable Kit' },
  { id: 'MND-022', name: 'Fitness Mantra Sports Socks' },
  { id: 'MND-023', name: 'Seagull Gadget Organizer Case' },
  { id: 'MND-024', name: 'Gizga Pro 3-in-1 Cleaning Kit' },
  { id: 'MND-025', name: 'DesiDiya DIY Infinity Mirror Tulip Cube LED Lamp' },
  { id: 'MND-026', name: 'Billebon Premium Neck Pillow (Black)' },
  { id: 'MND-027', name: 'Iris Lavender Fragrance Ceramic Vaporizer Set' },
  { id: 'MND-028', name: 'EKAM Reed Diffuser Gift Set' },
  { id: 'MND-029', name: 'Real Fruit Power Mixed Fruit Juice' },
  { id: 'MND-030', name: 'Bingo Tedhe Medhe Masala Tadka' },
  { id: 'MND-031', name: '7UP Nimbooz with Lemon Juice' },
  { id: 'MND-032', name: 'Kurkure Puffcorn Cheese Snacks' },
  { id: 'MND-033', name: 'Harpic Drain Xpert Cleaning Powder' },
  { id: 'MND-034', name: 'Doritos Nachos Sweet Chilli' },
  { id: 'MND-035', name: 'Lay\'s Chile Limon Chips' },
  { id: 'MND-036', name: 'ACT II Classic Salted Popcorn' },
  { id: 'MND-037', name: 'Colgate Sensitive Toothbrush' },
  { id: 'MND-038', name: 'Paper Boat Mixed Berries Drink' },
  { id: 'MND-039', name: 'Lay\'s Magic Masala Chips' },
  { id: 'MND-040', name: 'Bingo Chilli Sprinkled Chips' },
  { id: 'MND-041', name: 'Bingo Mad Angles Achaari Masti' },
  { id: 'MND-042', name: 'ACT II Golden Sizzle Popcorn' },
  { id: 'MND-043', name: 'Billebon Premium Neck Pillow (Grey)' },
  { id: 'MND-044', name: 'Lay\'s Sizzling Hot Chips' },
  { id: 'MND-045', name: 'Paper Boat Aam Panna Drink' },
  { id: 'MND-046', name: 'ACT II Tomato Chilli Popcorn' },
  { id: 'MND-047', name: 'Cheetos Masala Balls' },
  { id: 'MND-048', name: 'Tropicana Pomegranate Delight Juice' },
  { id: 'MND-049', name: 'DesiDiya Universe Crystal Ball LED Lamp' },
  { id: 'MND-050', name: 'Clean Champ Flush Matic Pouch' },
  { id: 'MND-051', name: 'Paper Boat Lychee Drink' },
  { id: 'MND-052', name: 'Paper Boat Mango Drink' },
  { id: 'MND-053', name: 'Sensodyne Sensitive Toothbrush' },
  { id: 'MND-054', name: 'Quace Crystal Rain Drop String Light' },
  { id: 'MND-055', name: 'Shri Samriddhi Toilet Cleaner Brush' },
  { id: 'MND-056', name: 'ACT II Butter Delite Popcorn' },
  { id: 'MND-057', name: 'Oral-B Pro Clean Sensitive Toothbrush' },
  { id: 'MND-058', name: 'Lay\'s West Indies Hot \'n\' Sweet Chilli Chips' },
  { id: 'MND-059', name: 'SaleOn Tech Pouch Organizer' }
];

export default function PrizeCatalogPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fisher-Yates shuffle algorithm to jumble the prizes
    const jumbled = [...PRIZE_LIST];
    for (let i = jumbled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [jumbled[i], jumbled[j]] = [jumbled[j], jumbled[i]];
    }
    
    setPrizes(jumbled);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-chaos-pink border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-8 h-8 text-chaos-pink" />
            <h1 className="text-5xl md:text-6xl font-black italic uppercase text-white">
              Prize Catalog
            </h1>
            <Sparkles className="w-8 h-8 text-chaos-green" />
          </div>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            // {prizes.length} PRIZES AVAILABLE // CHAOS AWAITS //
          </p>
        </motion.div>

        {/* Prize Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="group relative"
            >
              <div className="bg-zinc-900 border-2 border-zinc-800 p-4 hover:border-chaos-pink transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-chaos-pink/20 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-chaos-pink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm leading-tight break-words">
                      {prize.name}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Glitch effect on hover */}
              <div className="absolute inset-0 border-2 border-chaos-green opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform translate-x-1 translate-y-1"></div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-600 font-mono text-xs uppercase tracking-wider">
            // Prizes are randomly shuffled // Good luck //
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Made with Bob
