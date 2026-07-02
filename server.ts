import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc, runTransaction, writeBatch, query, limit } from "firebase/firestore";
import { MenuItem, Order, DailyEarning, OrderStatus } from "./src/types.js";

// CommonJS paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Load dynamic Firebase configurations
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  } catch (err) {
    console.error("[Cafe Server] Failed to read firebase-applet-config.json:", err);
  }
}

const projectId = firebaseConfig?.projectId || "sturdy-bonbon-wkm1r";
const databaseId = firebaseConfig?.firestoreDatabaseId || "ai-studio-16407011-02d3-4b4a-86be-3a9d850da6e2";

console.log(`[Cafe Server] Initializing Client Firebase SDK in server: Project ID: "${projectId}", Database: "${databaseId}"`);

const firebaseApp = initializeApp(firebaseConfig || {
  projectId: projectId
});

// Access custom Firestore database ID using client web SDK
const db = getFirestore(firebaseApp, databaseId);

// Initial Seed Menu items
const SEED_MENU: MenuItem[] = [
  // ==================== VEG SOUPS ====================
  {
    id: "v_soup1_h",
    name: "Veg Manchow Soup (Half)",
    category: "Veg",
    price: 60,
    description: "Spicy and hot soup topped with crispy fried noodles.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_soup1_f",
    name: "Veg Manchow Soup (Full)",
    category: "Veg",
    price: 100,
    description: "Spicy and hot soup loaded with garden vegetables, topped with crispy noodles.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_soup2_h",
    name: "Veg Hot & Sour Soup (Half)",
    category: "Veg",
    price: 60,
    description: "Traditional tangy and spicy broth filled with shredded vegetables.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_soup2_f",
    name: "Veg Hot & Sour Soup (Full)",
    category: "Veg",
    price: 100,
    description: "Tangy and spicy broth loaded with corn, mushrooms, paneer, and fresh greens.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_soup3_h",
    name: "Veg Sweet Corn Soup (Half)",
    category: "Veg",
    price: 70,
    description: "Creamy sweet corn kernels slow simmered in an aromatic white pepper broth.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_soup3_f",
    name: "Veg Sweet Corn Soup (Full)",
    category: "Veg",
    price: 120,
    description: "Creamy sweet corn kernels simmered to rich thick perfection with seasoned herbs.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG STARTERS ====================
  {
    id: "v_star1_h",
    name: "Veg 65 (Half)",
    category: "Veg",
    price: 110,
    description: "Crispy coated vegetable florets tossed in hot aromatic South Indian spices.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star1_f",
    name: "Veg 65 (Full)",
    category: "Veg",
    price: 200,
    description: "Generous platter of deep-fried spicy seasoned vegetable balls with green curry leaf garnish.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star2_h",
    name: "Veg Chilli Dry/Gravy (Half)",
    category: "Veg",
    price: 110,
    description: "Mixed vegetable dumplings glazed in spicy dark soy, garlic, and green bell pepper sauce.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star2_f",
    name: "Veg Chilli Dry/Gravy (Full)",
    category: "Veg",
    price: 200,
    description: "Platter of vegetable dumplings wok-tossed in signature hot ginger-chilli glaze.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star3_h",
    name: "Veg Crispy (Half)",
    category: "Veg",
    price: 110,
    description: "Golden battered choice veggies dry fried and seasoned with hot Szechuan salt.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star3_f",
    name: "Veg Crispy (Full)",
    category: "Veg",
    price: 200,
    description: "Crunchy medley of lotus stems, baby corn, florets tossed in a sweet-spicy sticky sauce.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star4_h",
    name: "Veg Manchurian (Half)",
    category: "Veg",
    price: 110,
    description: "Classic Indo-Chinese dry/gravy fritters cooked with aromatic coriander base.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star4_f",
    name: "Veg Manchurian (Full)",
    category: "Veg",
    price: 200,
    description: "Indo-Chinese style delicious vegetable dumplings simmered in dark savory-tangy gravy.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star5_h",
    name: "Paneer 65 (Half)",
    category: "Veg",
    price: 110,
    description: "Tender cottage cheese chunks coated in bright red spices, deep fried and dried.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star5_f",
    name: "Paneer 65 (Full)",
    category: "Veg",
    price: 200,
    description: "Succulent paneer blocks soaked in garlic-curry leaves tempering.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star6_h",
    name: "Paneer Chilli Dry/Gravy (Half)",
    category: "Veg",
    price: 110,
    description: "Wok paneer cubes tossed with spring onion stalks, garlic cloves, and capsicum.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star6_f",
    name: "Paneer Chilli Dry/Gravy (Full)",
    category: "Veg",
    price: 220,
    description: "Perfectly seasoned cottage cheese wok-tossed with spicy dark soya base.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star7_h",
    name: "Potato Crispy (Half)",
    category: "Veg",
    price: 120,
    description: "Twin-battered crunchy potato fingers seasoned with salt, herbs, and sesame drizzle.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_star8_f",
    name: "Paneer Crispy (Full)",
    category: "Veg",
    price: 220,
    description: "Battered cottage cheese fingers deep fried and tossed with tangy oriental spices.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG RICE ====================
  {
    id: "v_rice1_f",
    name: "Veg Fried Rice (Full)",
    category: "Veg",
    price: 170,
    description: "Aromatic basmati rice tossed with diced carrots, beans, and fresh scallions.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_rice2_f",
    name: "Veg Schezwan Rice (Full)",
    category: "Veg",
    price: 180,
    description: "Fiery basmati rice loaded with red hot Szechuan oils and mixed vegetables.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_rice3_f",
    name: "Veg Manchurian Rice (Full)",
    category: "Veg",
    price: 180,
    description: "Tasty fried rice topped with an abundant bowl of vegetable Manchurian gravy.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_rice6_f",
    name: "Veg Triple Rice (Full)",
    category: "Veg",
    price: 220,
    description: "Layer of fried rice, crispy fried noodles, served with hot spicy Schezwan gravy.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_rice8_f",
    name: "Paneer Fried Rice (Full)",
    category: "Veg",
    price: 200,
    description: "Delicious seasoned rice tossed with loaded grilled paneer blocks.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG NOODLES ====================
  {
    id: "v_nood1_f",
    name: "Veg Hakka Noodles (Full)",
    category: "Veg",
    price: 170,
    description: "Wok-fried noodles with crisp cabbage, julienned capsicum, and carrots.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_nood2_f",
    name: "Veg Schezwan Noodles (Full)",
    category: "Veg",
    price: 180,
    description: "Spicy thin noodles stir-fried with house special garlic-Schezwan paste.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_nood6_f",
    name: "Veg Triple Noodles (Full)",
    category: "Veg",
    price: 220,
    description: "Fusion platter combining noodles, fried rice, Manchurian balls, and schezwan chili sauce.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG MOMOS ====================
  {
    id: "v_momo1",
    name: "Veg Momos (9 Pcs)",
    category: "Veg",
    price: 90,
    description: "Delicate steamed flour dumplings packed with finely minced cabbage, carrots and onions.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_momo2",
    name: "Veg Cheese Momos",
    category: "Veg",
    price: 100,
    description: "Classic steamed vegetable momos packed with dynamic melted Amul cheese.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_momo3",
    name: "Corn & Cheese Momos",
    category: "Veg",
    price: 120,
    description: "Golden sweet corn kernels mixed with creamy mozzarella inside delicate wrappers.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_momo8",
    name: "Paneer Tikka Momos",
    category: "Veg",
    price: 120,
    description: "Smoked paneer tikka filling inside a deep fried kurkure crispy dumpling layout.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_momo9",
    name: "Cafe King Special Momos",
    category: "Veg",
    price: 180,
    description: "Chef's gourmet creation loaded with triple cheese, sweet corn, paneer and pan fried.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG SANDWICHES ====================
  {
    id: "v_sand1",
    name: "Veg Cheese Sandwich",
    category: "Veg",
    price: 100,
    description: "Sliced bread stacked with cucumbers, tomatoes, potatoes, mint chutney and cheese.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_sand2",
    name: "Veg Tandoori Sandwich",
    category: "Veg",
    price: 120,
    description: "Spiced vegetable mix coated in fiery tandoori mayo, toasted inside a sandwich maker.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_sand6",
    name: "Paneer Tandoori Sandwich",
    category: "Veg",
    price: 160,
    description: "Charred paneer cubes marinated in rich tandoori spices, loaded with peppers and cheese.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_sand8",
    name: "Cafe King Special Sandwich",
    category: "Veg",
    price: 200,
    description: "House special sandwich layered with paneer tikka, sweet corn, sliced olives, and cheese burst sauce.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG BURGERS ====================
  {
    id: "v_burg1",
    name: "Aloo Tikki Burger",
    category: "Veg",
    price: 79,
    description: "Crispy fried masala potato patty topped with house burger cream, sliced tomatoes.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_burg3",
    name: "Cheese Burger",
    category: "Veg",
    price: 100,
    description: "Veggies patty stacked with a slice of rich cheddar cheese, onions, and garlic spread.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_burg4",
    name: "Paneer Burger",
    category: "Veg",
    price: 120,
    description: "Crisp battered paneer slab, green mint dressing, topped with crisp visual lettuce.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_burg8",
    name: "Veg Maharaja Burger",
    category: "Veg",
    price: 160,
    description: "Towering double patty burger layered with cheese slices, gherkins, and jalapeno mayo.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG FRIES ====================
  {
    id: "v_fry1",
    name: "French Fries (Plain)",
    category: "Veg",
    price: 100,
    description: "Classic golden crisped potato fingers lightly dusted with structural sea salt.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_fry3",
    name: "Peri Peri Fries",
    category: "Veg",
    price: 120,
    description: "Golden fries tossed in bold hot African peri peri seasoning blend.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_fry6",
    name: "Italian Cheese Fries",
    category: "Veg",
    price: 130,
    description: "Loaded fries baked with dynamic mozzarella, Italian mixed herbs and olive oil.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG PIZZA ====================
  {
    id: "v_piz1_6",
    name: "Mix Veg Pizza (6 Inch)",
    category: "Veg",
    price: 140,
    description: "Personal size pizza crust loaded with onions, peppers, tomatoes and cheese syrup.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_piz1_8",
    name: "Mix Veg Pizza (8 Inch)",
    category: "Veg",
    price: 180,
    description: "Perfect medium crust pizza paved with capsicum, tomatoes, crunchy corn and mozzarella.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_piz2_6",
    name: "Margherita Pizza (6 Inch)",
    category: "Veg",
    price: 140,
    description: "Simple single-cheese baked hand-stretched personal dough topped with tomato base.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_piz7_6",
    name: "Paneer Tandoori Pizza (6 Inch)",
    category: "Veg",
    price: 170,
    description: "Cottage cheese chunks tossed in hot tandoori marinade spread over cheese base.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_piz7_8",
    name: "Paneer Tandoori Pizza (8 Inch)",
    category: "Veg",
    price: 240,
    description: "Medium thin crust with loaded tandoor charred paneer blocks, red peppers, and mint crema.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_piz9_8",
    name: "Cafe King Special Pizza (8 Inch)",
    category: "Veg",
    price: 300,
    description: "Ultimate deep-pan pizza loaded with double cottage cheese layers, jalapenos, olives, and paneer tikka.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== VEG KFC STYLE ====================
  {
    id: "v_kfc1",
    name: "Veg Cheese Nuggets (6 Pcs)",
    category: "Veg",
    price: 100,
    description: "Crispy breaded potato-cheese nuggets fried to perfect high golden tint.",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_kfc3",
    name: "Cheese Popcorn",
    category: "Veg",
    price: 120,
    description: "Salty tiny crisp cheese clusters packed in a bucket, served with hot mayonnaise.",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== COFFEE ====================
  {
    id: "v_cof1",
    name: "Cold Coffee",
    category: "Veg",
    price: 100,
    description: "Perfect frothy blended coffee with double espresso shot and creamy milk scoop.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_cof2",
    name: "Butterscotch Coffee",
    category: "Veg",
    price: 140,
    description: "Frothy shake coffee infused with premium local butterscotch syrup extracts.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== COMBOS VEG ====================
  {
    id: "v_comb1",
    name: "Veg Meal Combo (Standard)",
    category: "Veg",
    price: 300,
    description: "Veg Personal Pizza + Mix Veg Burger + Plain Fries + Ice Cold Beverage.",
    image: "https://images.unsplash.com/photo-1615557960901-b458b8247714?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "v_comb2",
    name: "Veg Burger + Fries + Coke",
    category: "Veg",
    price: 229,
    description: "Crunchy burger combo featuring salted crispy wedges and sweet aerated drink.",
    image: "https://images.unsplash.com/photo-1615557960901-b458b8247714?w=500&auto=format&fit=crop&q=80"
  },


  // ==================== NON-VEG SOUPS ====================
  {
    id: "nv_soup1_h",
    name: "Chicken Manchow Soup (Half)",
    category: "Non-Veg",
    price: 60,
    description: "Classic hot soy preparation loaded with shredded chicken and egg whites.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_soup1_f",
    name: "Chicken Manchow Soup (Full)",
    category: "Non-Veg",
    price: 100,
    description: "Aromatic soya garlic broth thick with chicken chunks, ginger bits, crisp dry noodles.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_soup3_f",
    name: "Chicken Tomato Soup (Full)",
    category: "Non-Veg",
    price: 120,
    description: "Velvety spiced tomato puree cooked in standard rich chicken stock with croutons.",
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG STARTERS ====================
  {
    id: "nv_star1_h",
    name: "Chicken Lollipop Dry (Half)",
    category: "Non-Veg",
    price: 140,
    description: "Savory chicken drumettes shaped into lollipops, fried with crisp dynamic spice shell.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_star1_f",
    name: "Chicken Lollipop Dry (Full)",
    category: "Non-Veg",
    price: 240,
    description: "Giant platter of deep fried succulent red lollipop drummets, mint dip.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_star3_f",
    name: "Chicken Chilli Dry/Gravy (Full)",
    category: "Non-Veg",
    price: 220,
    description: "Battered tender chicken segments flashed with chopped garlic, green pepper bulbs, red chili.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_star7_f",
    name: "Chicken Crispy (Full)",
    category: "Non-Veg",
    price: 240,
    description: "Shredded chicken fried to absolute glass crispness tossed in sweet bell-pepper honey sauce.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG TANDOOR ====================
  {
    id: "nv_tand1",
    name: "Chicken Tikka Malai",
    category: "Non-Veg",
    price: 160,
    description: "Boneless chicken kebab logs marinated with cashew cream, cheese, and cardamom grill.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_tand2",
    name: "Chicken Tikka Red",
    category: "Non-Veg",
    price: 160,
    description: "Standard fiery hot skewered chicken blocks charred on clay oven coals.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_tand4_f",
    name: "Chicken Tandoori (Full)",
    category: "Non-Veg",
    price: 360,
    description: "Whole bone-in country bird marinated in heavy yogurt base spices, slow clay baked.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG RICE ====================
  {
    id: "nv_rice2_f",
    name: "Chicken Fried Rice (Full)",
    category: "Non-Veg",
    price: 170,
    description: "Wok fluffed basmati tossed with scrambled eggs, chicken chunks, spring scallions.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_rice5_f",
    name: "Chicken Triple Rice (Full)",
    category: "Non-Veg",
    price: 240,
    description: "Extravagant stack of chicken fried rice, crispy noodles, capped with a fried egg and heavy red poultry manchurian gravy.",
    image: "https://images.unsplash.com/photo-1603133872878-685f348e592a?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG NOODLES ====================
  {
    id: "nv_nood2_f",
    name: "Chicken Hakka Noodles (Full)",
    category: "Non-Veg",
    price: 170,
    description: "Traditional thin wheat noodles stir fried with shredded chicken strips and bell-peppers.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG SANDWICHES ====================
  {
    id: "nv_sand1",
    name: "Chicken Classic Sandwich",
    category: "Non-Veg",
    price: 120,
    description: "Simple classic diced chicken breast combined with thick black pepper mayonnaise.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_sand3",
    name: "Chicken Tandoori Sandwich",
    category: "Non-Veg",
    price: 160,
    description: "Toasted slices grilled with heavy tandoori chicken shreds, onion slivers, and cheese.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG BURGERS ====================
  {
    id: "nv_burg1",
    name: "Chicken Classic Burger",
    category: "Non-Veg",
    price: 120,
    description: "Crispy fried chicken breast steak, toasted buns, sliced onions, classic mayo.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_burg3",
    name: "Chicken Tandoori Burger",
    category: "Non-Veg",
    price: 150,
    description: "Minced char-broiled chicken patty soaked in dynamic tandoori spices and spicy sauce.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_burg6",
    name: "Chicken Maharaja Burger",
    category: "Non-Veg",
    price: 220,
    description: "Premium stacked double tall chicken fillet patties with real liquid cheese injection.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG PIZZA ====================
  {
    id: "nv_piz1_8",
    name: "Chicken Makhani Pizza (8 Inch)",
    category: "Non-Veg",
    price: 240,
    description: "Aromatic crust loaded with sweet butter poultry cream, chicken shreds, capsicum and cheese.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_piz2_8",
    name: "Tandoori Chicken Pizza (8 Inch)",
    category: "Non-Veg",
    price: 240,
    description: "Smoked red chicken tikka chunks baked over fresh cheddar base and mint reduction.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG MOMOS ====================
  {
    id: "nv_momo1",
    name: "Simply Chicken Momos",
    category: "Non-Veg",
    price: 130,
    description: "Fresh dough dumplings packed with tender spiced minced chicken breast.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_momo6",
    name: "Cafe King Special Chicken Momos",
    category: "Non-Veg",
    price: 200,
    description: "Fried premium chicken momos baked under mozzarella cheese burst layers.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG KFC STYLE ====================
  {
    id: "nv_kfc1",
    name: "Chicken Nuggets (6 Pcs)",
    category: "Non-Veg",
    price: 120,
    description: "Battered golden chicken nuggets served with hot tandoori cocktail dip.",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_kfc3",
    name: "Chicken Popcorn (12 Pcs)",
    category: "Non-Veg",
    price: 140,
    description: "Bite-size crunch chicken clusters dressed with peri-peri dust.",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== DRINKS AND SHAKES ====================
  {
    id: "nv_shake1",
    name: "Chocolate Milkshake",
    category: "Veg",
    price: 120,
    description: "Rich blended chocolate ice cream shake with chocolate drizzle.",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_shake4",
    name: "Oreo Milkshake",
    category: "Veg",
    price: 130,
    description: "Blended vanilla cream and chunks of heavy cookies.",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_shake5",
    name: "KitKat Milkshake",
    category: "Veg",
    price: 130,
    description: "Premium chocolate wafer drink blended with extra chocolate fudge.",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_moj2",
    name: "Lemon Mojito",
    category: "Veg",
    price: 100,
    description: "Muddled lime wedges, fresh mint leaves, cane crystals, sparkling soda.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_moj3",
    name: "Watermelon Mojito",
    category: "Veg",
    price: 100,
    description: "Fresh crushed watermelon pulp with lime, mint, and ice cubes.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80"
  },

  // ==================== NON-VEG COMBOS ====================
  {
    id: "nv_comb1",
    name: "Chicken Momos + Fries + Coke",
    category: "Non-Veg",
    price: 240,
    description: "Chicken steamed momos served with portion of salted fries and cold bottle.",
    image: "https://images.unsplash.com/photo-1615557960901-b458b8247714?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "nv_comb2",
    name: "Chicken Pizza + Burger + Fries + Drink",
    category: "Non-Veg",
    price: 360,
    description: "8-Inch Chicken Pizza plus Classic Chicken burger, French fries, and heavy beverage.",
    image: "https://images.unsplash.com/photo-1615557960901-b458b8247714?w=500&auto=format&fit=crop&q=80"
  }
];

// Helper to format date as YYYY-MM-DD
function getTodayString(offsetDays = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  return date.toISOString().split("T")[0];
}

// Check and seed menu collection on startup
async function checkAndSeedDatabase() {
  try {
    const menuCollectionRef = collection(db, "menu");
    const menuSnapshot = await getDocs(query(menuCollectionRef, limit(1)));
    if (menuSnapshot.empty) {
      console.log("[Cafe Server] Firestore 'menu' collection is empty. Seeding with default items...");
      const batch = writeBatch(db);
      for (const item of SEED_MENU) {
        const docRef = doc(db, "menu", item.id);
        batch.set(docRef, item);
      }
      await batch.commit();
      console.log("[Cafe Server] Successfully seeded menu items in Firestore.");
    } else {
      console.log("[Cafe Server] Firestore database is already initialized with menu items.");
    }
  } catch (err) {
    console.error("[Cafe Server] Error during Firestore initialization/seeding:", err);
  }
}

// Core API endpoints
// Get menu catalog
app.get("/api/menu", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "menu"));
    const menuItems = snapshot.docs.map(docSnap => docSnap.data() as MenuItem);
    res.json(menuItems);
  } catch (err: any) {
    console.error("[Cafe Server] Failed to fetch menu from Firestore:", err);
    res.status(500).json({ error: "Failed to fetch menu items", details: err?.message || err });
  }
});

// Update or add menu catalog item
app.post("/api/menu", async (req, res) => {
  const { name, category, price, description, image, id } = req.body;
  if (!name || !category || typeof price !== "number") {
    res.status(400).json({ error: "Missing required menu item fields" });
    return;
  }

  try {
    const itemId = id || "m_" + Date.now();
    const itemData: MenuItem = {
      id: itemId,
      name,
      category,
      price,
      description,
      image: image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80"
    };

    await setDoc(doc(db, "menu", itemId), itemData, { merge: true });
    res.json({ success: true, item: itemData });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to save menu item to Firestore:", err);
    res.status(500).json({ error: "Failed to save menu item", details: err?.message || err });
  }
});

// Delete item
app.post("/api/menu/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: "Item ID is required" });
    return;
  }
  try {
    await deleteDoc(doc(db, "menu", id));
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to delete menu item from Firestore:", err);
    res.status(500).json({ error: "Failed to delete menu item", details: err?.message || err });
  }
});

// Get orders
app.get("/api/orders", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const ordersList = snapshot.docs.map(docSnap => docSnap.data() as Order);
    const sorted = ordersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(sorted);
  } catch (err: any) {
    console.error("[Cafe Server] Failed to fetch orders from Firestore:", err);
    res.status(500).json({ error: "Failed to fetch orders", details: err?.message || err });
  }
});

// Create new order from customer applet
app.post("/api/orders", async (req, res) => {
  const { table_number, customer_name, items } = req.body;
  if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Table number and order items are required" });
    return;
  }

  try {
    // Look up menu secure prices
    const menuSnapshot = await getDocs(collection(db, "menu"));
    const menuList = menuSnapshot.docs.map(docSnap => docSnap.data() as MenuItem);

    let subtotal = 0;
    const orderItemsList = items.map((cartItem: any) => {
      const itemId = cartItem.id || (cartItem.menuItem ? cartItem.menuItem.id : "");
      const matchingMenuItem = menuList.find(m => m.id === itemId);
      
      const menuItemDetails = matchingMenuItem || cartItem.menuItem || {};
      const price = typeof menuItemDetails.price === "number" ? menuItemDetails.price : parseFloat(menuItemDetails.price) || 0;
      const name = menuItemDetails.name || "Unknown Item";
      const category = menuItemDetails.category || "Veg";
      const quantity = cartItem.quantity || 1;

      subtotal += price * quantity;

      return {
        id: itemId,
        name,
        price,
        quantity,
        category
      };
    });

    const tax = 0;
    const total_amount = subtotal;

    // Determine custom sequence order registration ID code
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const existingOrders = ordersSnapshot.docs.map(docSnap => docSnap.data() as Order);

    let maxCode = 5000;
    existingOrders.forEach(o => {
      const codeNum = parseInt(String(o.order_id || "").replace("#", ""), 10);
      if (!isNaN(codeNum) && codeNum > maxCode) {
        maxCode = codeNum;
      }
    });
    const nextCode = maxCode + 1;

    const newId = "ord_" + Date.now();
    const newOrder: Order = {
      id: newId,
      order_id: `#${nextCode}`,
      table_number,
      customer_name: customer_name || undefined,
      items: orderItemsList,
      subtotal,
      tax,
      total_amount,
      status: "Pending",
      created_at: new Date().toISOString()
    };

    // Save order record
    await setDoc(doc(db, "orders", newId), newOrder);

    // Save/update today's aggregate earnings
    const todayStr = getTodayString();
    const earningRef = doc(db, "earnings", todayStr);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(earningRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyEarning;
        transaction.update(earningRef, {
          amount: Number((data.amount + total_amount).toFixed(2)),
          orderCount: data.orderCount + 1
        });
      } else {
        transaction.set(earningRef, {
          date: todayStr,
          amount: total_amount,
          orderCount: 1
        });
      }
    });

    res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to create order in Firestore:", err);
    res.status(500).json({ error: "Failed to create order", details: err?.message || err });
  }
});

// Update or patch status handler
const handleStatusUpdate = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`[Cafe Server] Attempting to update status for order ID: "${id}" to "${status}"`);
  if (!status) {
    res.status(400).json({ error: "Status field is required" });
    return;
  }

  try {
    const decodedId = decodeURIComponent(id || "").trim();
    const cleanId = decodedId.startsWith("#") ? decodedId : `#${decodedId}`;

    const snapshot = await getDocs(collection(db, "orders"));
    let orderDoc = null;
    let originalOrder = null;

    for (const docSnap of snapshot.docs) {
      const o = docSnap.data() as Order;
      const oId = String(o.id || "").trim();
      const oOrderId = String(o.order_id || "").trim();

      if (
        oId === decodedId ||
        oOrderId === decodedId ||
        oOrderId === cleanId ||
        oId === cleanId ||
        oOrderId.replace("#", "") === decodedId.replace("#", "")
      ) {
        orderDoc = docSnap;
        originalOrder = o;
        break;
      }
    }

    if (!orderDoc || !originalOrder) {
      console.log(`[Cafe Server] Status update failed: Order with identifier "${decodedId}" not found`);
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const docId = orderDoc.id;
    const oldStatus = originalOrder.status;

    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      if (originalOrder.created_at) {
        const orderDate = originalOrder.created_at.split("T")[0];
        const earningRef = doc(db, "earnings", orderDate);

        await runTransaction(db, async (transaction) => {
          const docSnap = await transaction.get(earningRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as DailyEarning;
            transaction.update(earningRef, {
              amount: Number(Math.max(0, data.amount - originalOrder.total_amount).toFixed(2)),
              orderCount: Math.max(0, data.orderCount - 1)
            });
          }
        });
      }
    } else if (oldStatus === "Cancelled" && status !== "Cancelled") {
      if (originalOrder.created_at) {
        const orderDate = originalOrder.created_at.split("T")[0];
        const earningRef = doc(db, "earnings", orderDate);

        await runTransaction(db, async (transaction) => {
          const docSnap = await transaction.get(earningRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as DailyEarning;
            transaction.update(earningRef, {
              amount: Number((data.amount + originalOrder.total_amount).toFixed(2)),
              orderCount: data.orderCount + 1
            });
          } else {
            transaction.set(earningRef, {
              date: orderDate,
              amount: originalOrder.total_amount,
              orderCount: 1
            });
          }
        });
      }
    }

    const updatedOrder = { ...originalOrder, status: status as any };
    await setDoc(doc(db, "orders", docId), updatedOrder, { merge: true });

    console.log(`[Cafe Server] Status of order "${originalOrder.order_id}" updated successfully to "${status}"`);
    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to update order status in Firestore:", err);
    res.status(500).json({ error: "Failed to update order status", details: err?.message || err });
  }
};

app.patch("/api/orders/:id/status", handleStatusUpdate);
app.put("/api/orders/:id/status", handleStatusUpdate);

// Delete order
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Cafe Server] Attempting to delete order using param: "${id}"`);
    if (!id) {
      res.status(400).json({ error: "Missing order ID parameter" });
      return;
    }

    const decodedId = decodeURIComponent(id).trim();
    const cleanId = decodedId.startsWith("#") ? decodedId : `#${decodedId}`;

    const snapshot = await getDocs(collection(db, "orders"));
    let orderDoc = null;
    let deletedOrder = null;

    for (const docSnap of snapshot.docs) {
      const o = docSnap.data() as Order;
      const oId = String(o.id || "").trim();
      const oOrderId = String(o.order_id || "").trim();

      if (
        oId === decodedId || 
        oOrderId === decodedId ||
        oOrderId === cleanId ||
        oId === cleanId ||
        oOrderId.replace("#", "") === decodedId.replace("#", "")
      ) {
        orderDoc = docSnap;
        deletedOrder = o;
        break;
      }
    }

    if (!orderDoc || !deletedOrder) {
      console.log(`[Cafe Server] Order with matching string "${decodedId}" not found in Firestore`);
      res.status(404).json({ error: `Order with identifier ${decodedId} not found` });
      return;
    }

    await deleteDoc(doc(db, "orders", orderDoc.id));
    console.log(`[Cafe Server] Successfully deleted order ${deletedOrder.order_id} (Document ID: ${orderDoc.id})`);

    res.json({ success: true, message: `Successfully deleted order ${deletedOrder.order_id}` });
  } catch (err: any) {
    console.error("[Cafe Server] Exception in delete route:", err);
    res.status(500).json({ error: "Internal server error occurred", details: err?.message || err });
  }
});

// Get earnings breakdown
app.get("/api/earnings", async (req, res) => {
  try {
    const earningsSnapshot = await getDocs(collection(db, "earnings"));
    const earningsList = earningsSnapshot.docs.map(docSnap => docSnap.data() as DailyEarning);

    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const ordersList = ordersSnapshot.docs.map(docSnap => docSnap.data() as Order);

    const todayStr = getTodayString();
    const curMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    let totalRevenue = 0;
    let totalOrdersCount = 0;
    let todayRevenue = 0;
    let todayOrdersCount = 0;
    let monthRevenue = 0;
    let monthOrdersCount = 0;

    earningsList.forEach(e => {
      totalRevenue += e.amount;
      totalOrdersCount += e.orderCount;
      if (e.date === todayStr) {
        todayRevenue = e.amount;
        todayOrdersCount = e.orderCount;
      }
      if (e.date.startsWith(curMonthPrefix)) {
        monthRevenue += e.amount;
        monthOrdersCount += e.orderCount;
      }
    });

    const pendingOrdersCount = ordersList.filter(o => o.status === "Pending").length;
    const completedOrdersCount = ordersList.filter(o => o.status === "Served").length;
    const activeTablesCount = new Set(ordersList.filter(o => ["Pending", "Preparing", "Ready"].includes(o.status)).map(o => o.table_number)).size;

    res.json({
      summary: {
        todayRevenue: Number(todayRevenue.toFixed(2)),
        todayOrdersCount,
        monthRevenue: Number(monthRevenue.toFixed(2)),
        monthOrdersCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrdersCount,
        pendingOrdersCount,
        completedOrdersCount,
        activeTablesCount
      },
      history: earningsList.sort((a,b) => a.date.localeCompare(b.date))
    });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to fetch earnings from Firestore:", err);
    res.status(500).json({ error: "Failed to compile earnings breakdown", details: err?.message || err });
  }
});

// Admin login verification
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "king123") {
    res.json({ success: true, token: "session_cafe_king_token_2026", username: "Cafe King" });
  } else {
    res.status(401).json({ error: "Invalid cafe credentials. Try username 'admin' and password 'king123'" });
  }
});

// Helper function to delete all documents in a collection
async function deleteCollection(collectionPath: string) {
  const collectionRef = collection(db, collectionPath);
  const snapshot = await getDocs(collectionRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

// Database reset endpoint
app.post("/api/reset", async (req, res) => {
  try {
    console.log("[Cafe Server] Resetting database back to original seeds in Firestore");
    
    // Clear live dynamic collections
    await deleteCollection("orders");
    await deleteCollection("earnings");
    await deleteCollection("menu");

    // Populate seeds in menu
    const batch = writeBatch(db);
    for (const item of SEED_MENU) {
      const docRef = doc(db, "menu", item.id);
      batch.set(docRef, item);
    }
    await batch.commit();

    res.json({ success: true, message: "Database reset to seeds successfully in Firestore" });
  } catch (err: any) {
    console.error("[Cafe Server] Failed to reset database in Firestore:", err);
    res.status(500).json({ error: "Failed to reset database", details: err?.message || err });
  }
});

// Unmatched API routes fallback to 404 JSON to prevent HTML SPA response for APIs
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.url} not found` });
});


// Dev vs Production Setup
const startServer = async () => {
  // Pre-seed Firestore if needed before serving routes
  await checkAndSeedDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cafe Server] Running at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
