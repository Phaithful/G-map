import { 
  GraduationCap, 
  Home, 
  Coffee, 
  Briefcase,
  Dumbbell,
  ShoppingBag,
  Heart,
  Church
} from "lucide-react";
import { motion } from "framer-motion";

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const categories: Category[] = [
  { id: "academics", name: "Academics", icon: <GraduationCap className="w-6 h-6" /> },
  { id: "offices", name: "Offices", icon: <Briefcase className="w-6 h-6" /> },
  { id: "hostels", name: "Hostels", icon: <Home className="w-6 h-6" /> },
  { id: "food", name: "Food", icon: <Coffee className="w-6 h-6" /> },
  { id: "health", name: "Health", icon: <Heart className="w-6 h-6" /> },
  { id: "churches", name: "Churches", icon: <Church className="w-6 h-6" /> },
  { id: "sports", name: "Sports", icon: <Dumbbell className="w-6 h-6" /> },
  { id: "shops", name: "Shops", icon: <ShoppingBag className="w-6 h-6" /> },
];

interface CategoryChipsProps {
  selectedCategory?: string | null;
  onSelect?: (categoryId: string) => void;
}

const CategoryChips = ({ selectedCategory, onSelect }: CategoryChipsProps) => {
  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect?.(category.id)}
            className={`category-chip flex-shrink-0 min-w-[80px] ${
              selectedCategory === category.id 
                ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30' 
                : ''
            }`}
          >
            <span className={selectedCategory === category.id ? 'text-primary-foreground' : 'text-primary'}>
              {category.icon}
            </span>
            <span className="text-xs font-medium whitespace-nowrap">
              {category.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategoryChips;
