// Sample catalogue standing in for the AI + live shop search. Prices are illustrative.
const SLOTS = ['Top', 'Bottom', 'Shoes', 'Layer', 'Accessory'];

// Each family is one garment; every colour becomes its own item, id "family:Colour".
const FAMILIES = {
  tee_heavy: { slot: 'Top', name: 'Heavyweight tee', fit: 'Regular, ends at the hip', price: 15, shop: 'Uniqlo', looks: ['Casual', 'Streetwear'], why: 'Thick cotton holds its shape, so it looks sharp instead of sloppy.', colours: [['White', '#F1EEE6'], ['Black', '#1C1C1C'], ['Grey marl', '#9A9A9A'], ['Navy', '#1F2A44'], ['Cream', '#E8DFCC']] },
  tee_budget: { slot: 'Top', name: 'Cotton tee', fit: 'Regular', price: 8, shop: 'H&M', looks: ['Casual', 'Streetwear', 'Gym'], why: 'Cheap, clean, and nobody can tell the difference under a layer.', colours: [['White', '#F4F4F0'], ['Black', '#1E1E1E'], ['Grey', '#A3A3A3']] },
  tee_boxy: { slot: 'Top', name: 'Boxy heavyweight tee', fit: 'Boxy, slightly cropped', price: 20, shop: 'H&M', looks: ['Streetwear'], why: 'Boxy and heavy is the base of the whole streetwear look.', colours: [['Black', '#1C1C1C'], ['Off-white', '#EEEAE0'], ['Washed brown', '#7A5E48'], ['Sage', '#8F9A7E']] },
  oxford: { slot: 'Top', name: 'Oxford shirt', fit: 'Slim', price: 30, shop: 'Uniqlo', looks: ['Casual', 'Smart Casual', 'Old Money'], why: 'Works buttoned or open over a tee. One piece, two looks.', colours: [['Light blue', '#BFD3E6'], ['White', '#FAFAFA'], ['Pale pink', '#E8C9C4']] },
  linen: { slot: 'Top', name: 'Linen shirt', fit: 'Relaxed', price: 25, shop: 'M&S', looks: ['Casual', 'Old Money', 'Night Out'], why: 'Breathes in summer and looks better slightly creased.', colours: [['White', '#F7F5EF'], ['Sand', '#D8C8A8'], ['Light blue', '#C9D8E6']] },
  polo_knit: { slot: 'Top', name: 'Knitted polo', fit: 'Fitted', price: 35, shop: 'Zara', looks: ['Smart Casual', 'Old Money', 'Night Out'], why: 'Smarter than a tee, easier than a shirt. The fastest upgrade there is.', colours: [['Navy', '#1F2A44'], ['Cream', '#E8DFCC'], ['Brown', '#6B4A2F'], ['Black', '#1A1A1A']] },
  shirt_slim: { slot: 'Top', name: 'Slim shirt', fit: 'Slim, sleeves rolled', price: 30, shop: 'Zara', looks: ['Night Out', 'Smart Casual'], why: 'A proper shirt near the face looks sharp in low light.', colours: [['Black', '#161616'], ['White', '#FAFAFA'], ['Navy', '#1F2A44']] },
  hoodie: { slot: 'Top', name: 'Plain hoodie', fit: 'Relaxed', price: 30, shop: 'Uniqlo', looks: ['Streetwear', 'Casual'], why: 'No logos, good weight. Looks more expensive than it is.', colours: [['Grey marl', '#9A9A9A'], ['Black', '#1C1C1C'], ['Navy', '#1F2A44'], ['Brown', '#6B5040']] },
  tee_train: { slot: 'Top', name: 'Training tee', fit: 'Athletic cut', price: 20, shop: 'Gymshark', looks: ['Gym'], why: 'Close through the chest and arms, room at the waist.', colours: [['Black', '#1E1E1E'], ['White', '#F0F0EC'], ['Grey', '#8A8C90'], ['Navy', '#1F2A44']] },
  tank: { slot: 'Top', name: 'Training vest', fit: 'Relaxed armhole', price: 16, shop: 'Gymshark', looks: ['Gym'], why: 'Nothing in the way on arm and shoulder days.', colours: [['Black', '#1E1E1E'], ['Grey', '#8A8C90']] },

  jeans: { slot: 'Bottom', name: 'Straight jeans', fit: 'Straight', price: 40, shop: "Levi's", looks: ['Casual', 'Night Out', 'Streetwear'], why: 'Straight leg, proper denim. Goes with nearly everything.', colours: [['Dark indigo', '#26324A'], ['Black', '#1E1E1E'], ['Light wash', '#8FA7C2']] },
  jeans_budget: { slot: 'Bottom', name: 'Straight jeans', fit: 'Straight', price: 20, shop: 'H&M', looks: ['Casual', 'Night Out', 'Streetwear'], why: 'Half the price, and dark denim hides the difference.', colours: [['Dark indigo', '#2A3550'], ['Black', '#222222']] },
  chinos: { slot: 'Bottom', name: 'Tapered chinos', fit: 'Slim tapered', price: 30, shop: 'Uniqlo', looks: ['Casual', 'Smart Casual', 'Old Money'], why: 'The taper cleans up the line from hip to ankle.', colours: [['Stone', '#C8BBA0'], ['Navy', '#243049'], ['Olive', '#5B5E3C'], ['Black', '#1E1E1E']] },
  tailored: { slot: 'Bottom', name: 'Tailored trousers', fit: 'Slim', price: 45, shop: 'Zara', looks: ['Smart Casual', 'Night Out'], why: 'Proper trousers do more for looking put together than anything else.', colours: [['Charcoal', '#3A3B3F'], ['Navy', '#243049'], ['Black', '#1A1A1A']] },
  pleated: { slot: 'Bottom', name: 'Pleated trousers', fit: 'Relaxed taper', price: 40, shop: 'Mango', looks: ['Old Money', 'Smart Casual'], why: 'A little volume up top, clean at the ankle.', colours: [['Grey', '#8E8C88'], ['Cream', '#DCD3C0'], ['Brown', '#6B4A2F']] },
  cargo: { slot: 'Bottom', name: 'Cargo trousers', fit: 'Relaxed straight', price: 40, shop: 'H&M', looks: ['Streetwear'], why: 'Relaxed on top, stacks slightly at the shoe.', colours: [['Olive', '#4E5238'], ['Black', '#1E1E1E'], ['Stone', '#BFB39A']] },
  shorts_train: { slot: 'Bottom', name: '7-inch training shorts', fit: 'Above the knee', price: 20, shop: 'Gymshark', looks: ['Gym'], why: 'Above the knee looks more athletic.', colours: [['Charcoal', '#333333'], ['Black', '#1A1A1A'], ['Navy', '#1F2A44']] },
  shorts_chino: { slot: 'Bottom', name: 'Chino shorts', fit: 'Above the knee', price: 20, shop: 'Uniqlo', looks: ['Casual', 'Old Money'], why: 'Five inches above the knee. Longer shorts shrink you.', colours: [['Stone', '#C8BBA0'], ['Navy', '#243049']] },
  joggers: { slot: 'Bottom', name: 'Tapered joggers', fit: 'Tapered, cuffed', price: 30, shop: 'Nike', looks: ['Gym', 'Streetwear'], why: 'Clean enough to wear to and from the gym.', colours: [['Black', '#1C1C1C'], ['Grey', '#8A8C90']] },

  trainers: { slot: 'Shoes', name: 'Leather trainers', fit: 'Low profile', price: 45, shop: 'ASOS', looks: ['Casual', 'Smart Casual', 'Streetwear', 'Night Out', 'Old Money'], why: 'The one shoe that makes almost any outfit look deliberate.', colours: [['White', '#F2F2EE'], ['Black', '#1A1A1A']] },
  trainers_premium: { slot: 'Shoes', name: 'Minimal leather trainers', fit: 'Low profile', price: 85, shop: 'COS', looks: ['Casual', 'Smart Casual', 'Old Money'], why: 'Better leather, cleaner lines. Worth it if you wear trainers daily.', colours: [['White', '#F5F4F0'], ['Tan', '#A57A4F']] },
  loafers: { slot: 'Shoes', name: 'Suede loafers', fit: 'Classic', price: 55, shop: 'ASOS', looks: ['Old Money', 'Smart Casual', 'Night Out'], why: 'Dressy without being formal. Sockless in summer.', colours: [['Brown', '#6B4A2F'], ['Black', '#1A1A1A']] },
  chelsea: { slot: 'Shoes', name: 'Chelsea boots', fit: 'Slim toe', price: 65, shop: 'ASOS', looks: ['Night Out', 'Smart Casual', 'Casual'], why: 'Sleek, and they add a bit of height.', colours: [['Black', '#1A1A1A'], ['Brown suede', '#7A5A3E']] },
  desert: { slot: 'Shoes', name: 'Desert boots', fit: 'Ankle height', price: 30, shop: 'Vinted (used)', looks: ['Casual'], why: 'Softer than trainers, still easy. Secondhand keeps it cheap.', colours: [['Sand', '#B89A72'], ['Brown', '#5C3A21']] },
  skate: { slot: 'Shoes', name: 'Canvas skate shoes', fit: 'Low top', price: 60, shop: 'Vans', looks: ['Streetwear', 'Casual'], why: 'Flat and simple, goes with every streetwear piece.', colours: [['Black', '#222222'], ['White', '#F0F0EC']] },
  canvas: { slot: 'Shoes', name: 'Flat canvas trainers', fit: 'Flat sole', price: 55, shop: 'Converse', looks: ['Gym', 'Casual', 'Streetwear'], why: 'Stable for lifting, and fine outside the gym.', colours: [['White', '#F0F0EC'], ['Black', '#1E1E1E']] },
  runners: { slot: 'Shoes', name: 'Running trainers', fit: 'Cushioned', price: 70, shop: 'ASICS', looks: ['Gym'], why: 'If you do cardio, this is the pair that does it all.', colours: [['Grey', '#8E9296'], ['Black', '#1E1E1E']] },

  overshirt: { slot: 'Layer', name: 'Overshirt', fit: 'Boxy, hip length', price: 35, shop: 'H&M', looks: ['Casual', 'Streetwear'], why: 'Adds shape across the shoulders without bulk.', colours: [['Olive', '#5B5E3C'], ['Navy', '#243049'], ['Tan', '#9C7A4E'], ['Black', '#1E1E1E']] },
  denim_jacket: { slot: 'Layer', name: 'Denim jacket', fit: 'Cropped at the waist', price: 40, shop: 'H&M', looks: ['Casual'], why: 'A classic that never looks like you tried too hard.', colours: [['Mid blue', '#5A7598'], ['Black', '#262626']] },
  merino: { slot: 'Layer', name: 'Merino jumper', fit: 'Fitted crew neck', price: 35, shop: 'Uniqlo', looks: ['Smart Casual', 'Old Money', 'Night Out', 'Casual'], why: 'Thin enough to layer, smart enough for work.', colours: [['Navy', '#243049'], ['Grey', '#8E9094'], ['Camel', '#B08A5B'], ['Black', '#1C1C1C']] },
  cable: { slot: 'Layer', name: 'Cable-knit jumper', fit: 'Regular', price: 40, shop: 'Vinted (used)', looks: ['Old Money'], why: 'Texture reads expensive. Over the shoulders if it’s warm.', colours: [['Navy', '#243049'], ['Cream', '#E6DCC6']] },
  knit_qzip: { slot: 'Layer', name: 'Knitted quarter-zip', fit: 'Regular', price: 35, shop: 'M&S', looks: ['Old Money', 'Smart Casual'], why: 'The quiet-money layer. Collar up, sleeves pushed.', colours: [['Navy', '#243049'], ['Cream', '#E6DCC6']] },
  blazer: { slot: 'Layer', name: 'Unstructured blazer', fit: 'Soft shoulder', price: 80, shop: 'Zara', looks: ['Smart Casual', 'Night Out', 'Old Money'], why: 'Instant structure through the shoulders, no stiff suit feel.', colours: [['Navy', '#26324A'], ['Charcoal', '#3A3B3F']] },
  bomber: { slot: 'Layer', name: 'Bomber jacket', fit: 'Cropped at the waist', price: 40, shop: 'ASOS', looks: ['Streetwear', 'Night Out'], why: 'Short length keeps the legs looking long.', colours: [['Black', '#202020'], ['Olive', '#4E5238']] },
  qzip: { slot: 'Layer', name: 'Training quarter-zip', fit: 'Fitted', price: 35, shop: 'Gymshark', looks: ['Gym'], why: 'Warm-up layer that still shows your shape.', colours: [['Grey', '#7D7F83'], ['Black', '#1E1E1E']] },
  zip_hoodie: { slot: 'Layer', name: 'Zip hoodie', fit: 'Regular', price: 30, shop: 'Uniqlo', looks: ['Gym', 'Streetwear', 'Casual'], why: 'Simple, and it goes over anything.', colours: [['Navy', '#1F2A44'], ['Grey', '#8A8C90']] },

  watch_steel: { slot: 'Accessory', name: 'Steel watch', fit: 'Small face', price: 25, shop: 'Casio', looks: ['Casual', 'Streetwear'], why: 'A watch is the cheapest signal that you thought about it.', colours: [['Silver', '#BFC3C7']] },
  watch_leather: { slot: 'Accessory', name: 'Leather strap watch', fit: 'Slim case', price: 30, shop: 'Timex', looks: ['Smart Casual', 'Old Money', 'Night Out'], why: 'Match the strap to your shoes and the outfit ties together.', colours: [['Tan', '#A0703F'], ['Black', '#1A1A1A']] },
  belt: { slot: 'Accessory', name: 'Leather belt', fit: '3cm width', price: 18, shop: 'M&S', looks: ['Smart Casual', 'Old Money', 'Casual', 'Night Out'], why: 'Finishes the waist so the outfit reads as one.', colours: [['Brown', '#5C3A21'], ['Black', '#1A1A1A']] },
  cap: { slot: 'Accessory', name: 'Plain cap', fit: 'Curved peak', price: 15, shop: 'Nike', looks: ['Gym', 'Streetwear', 'Casual'], why: 'Keeps it simple on a bad hair day.', colours: [['Black', '#1A1A1A'], ['Navy', '#1F2A44'], ['Stone', '#C8BBA0']] },
  beanie: { slot: 'Accessory', name: 'Beanie', fit: 'Short, above the ear', price: 12, shop: 'ASOS', looks: ['Streetwear', 'Casual'], why: 'Frames the face and finishes the look.', colours: [['Charcoal', '#3A3A3A'], ['Black', '#1C1C1C'], ['Olive', '#4E5238']] },
  holdall: { slot: 'Accessory', name: 'Holdall', fit: 'Medium', price: 25, shop: 'Decathlon', looks: ['Gym'], why: 'One tidy bag beats a rucksack stuffed with kit.', colours: [['Black', '#222222']] },
  scent: { slot: 'Accessory', name: 'Fragrance', fit: '30ml', price: 30, shop: 'Zara', looks: ['Night Out', 'Smart Casual'], why: 'People notice it before they notice the outfit. Two sprays, not five.', colours: [['Fresh, woody', '#C9B79C']] },
  sunglasses: { slot: 'Accessory', name: 'Sunglasses', fit: 'Medium frame', price: 15, shop: 'ASOS', looks: ['Casual', 'Old Money', 'Streetwear'], why: 'The easiest way to look finished in summer.', colours: [['Tortoise', '#6B4A2F'], ['Black', '#1A1A1A']] },
};

const ITEMS = {};
Object.entries(FAMILIES).forEach(([family, f]) => {
  f.colours.forEach(([colour, hex]) => {
    const id = `${family}:${colour}`;
    ITEMS[id] = { id, family, colour, hex, slot: f.slot, name: f.name, fit: f.fit, price: f.price, shop: f.shop, why: f.why, looks: f.looks };
  });
});

// Signature piece per slot: what each look reaches for first.
const LOOKS = {
  Casual: {
    tint: '#56654A',
    tagline: 'Weekends, errands, the pub.',
    signature: { Top: 'tee_heavy:White', Bottom: 'jeans:Dark indigo', Shoes: 'trainers:White', Layer: 'overshirt:Olive', Accessory: 'watch_steel:Silver' },
  },
  'Smart Casual': {
    tint: '#2F3E56',
    tagline: 'Work, dinners, anywhere a tee won’t cut it.',
    signature: { Top: 'oxford:Light blue', Bottom: 'chinos:Stone', Shoes: 'loafers:Brown', Layer: 'merino:Navy', Accessory: 'watch_leather:Tan' },
  },
  'Old Money': {
    tint: '#7A5C3A',
    tagline: 'Quiet, expensive-looking, no logos.',
    signature: { Top: 'polo_knit:Cream', Bottom: 'pleated:Grey', Shoes: 'loafers:Brown', Layer: 'cable:Navy', Accessory: 'watch_leather:Tan' },
  },
  Streetwear: {
    tint: '#2A2A2A',
    tagline: 'Relaxed fits, clean trainers, no big logos.',
    signature: { Top: 'tee_boxy:Black', Bottom: 'cargo:Olive', Shoes: 'trainers:White', Layer: 'bomber:Black', Accessory: 'beanie:Charcoal' },
  },
  'Night Out': {
    tint: '#5E2230',
    tagline: 'Dinners, drinks, nights out.',
    signature: { Top: 'shirt_slim:Black', Bottom: 'jeans:Black', Shoes: 'chelsea:Black', Layer: 'bomber:Black', Accessory: 'scent:Fresh, woody' },
  },
  Gym: {
    tint: '#3F5263',
    tagline: 'Training, and looking good doing it.',
    signature: { Top: 'tee_train:Black', Bottom: 'shorts_train:Charcoal', Shoes: 'canvas:White', Layer: 'qzip:Grey', Accessory: 'cap:Black' },
  },
};

const LOOK_ORDER = Object.keys(LOOKS);

// Ready-made outfits for the Browse carousel.
const OUTFITS = [
  { name: 'Clean Basics', look: 'Casual', pieces: { Top: 'tee_heavy:White', Bottom: 'jeans:Dark indigo', Shoes: 'trainers:White', Layer: 'overshirt:Navy', Accessory: 'watch_steel:Silver' } },
  { name: 'Weekend Earth Tones', look: 'Casual', pieces: { Top: 'tee_heavy:Cream', Bottom: 'chinos:Olive', Shoes: 'desert:Sand', Layer: 'overshirt:Tan', Accessory: 'sunglasses:Tortoise' } },
  { name: 'Budget Starter', look: 'Casual', pieces: { Top: 'tee_budget:White', Bottom: 'jeans_budget:Dark indigo', Shoes: 'canvas:White', Layer: 'overshirt:Olive', Accessory: 'beanie:Charcoal' } },
  { name: 'Summer Linen', look: 'Old Money', pieces: { Top: 'linen:White', Bottom: 'shorts_chino:Navy', Shoes: 'loafers:Brown', Layer: 'cable:Cream', Accessory: 'sunglasses:Tortoise' } },
  { name: 'Quiet Luxury', look: 'Old Money', pieces: { Top: 'oxford:White', Bottom: 'pleated:Cream', Shoes: 'loafers:Brown', Layer: 'knit_qzip:Navy', Accessory: 'watch_leather:Tan' } },
  { name: 'Office Ready', look: 'Smart Casual', pieces: { Top: 'oxford:White', Bottom: 'tailored:Navy', Shoes: 'loafers:Black', Layer: 'blazer:Charcoal', Accessory: 'belt:Black' } },
  { name: 'Friday Smart', look: 'Smart Casual', pieces: { Top: 'polo_knit:Brown', Bottom: 'chinos:Stone', Shoes: 'trainers:White', Layer: 'merino:Camel', Accessory: 'watch_leather:Tan' } },
  { name: 'All Black', look: 'Night Out', pieces: { Top: 'shirt_slim:Black', Bottom: 'tailored:Black', Shoes: 'chelsea:Black', Layer: 'bomber:Black', Accessory: 'watch_leather:Black' } },
  { name: 'Dinner Out', look: 'Night Out', pieces: { Top: 'polo_knit:Navy', Bottom: 'jeans:Dark indigo', Shoes: 'chelsea:Brown suede', Layer: 'blazer:Navy', Accessory: 'scent:Fresh, woody' } },
  { name: 'Relaxed Street', look: 'Streetwear', pieces: { Top: 'hoodie:Grey marl', Bottom: 'cargo:Black', Shoes: 'skate:Black', Layer: 'bomber:Olive', Accessory: 'cap:Black' } },
  { name: 'Earthy Street', look: 'Streetwear', pieces: { Top: 'tee_boxy:Washed brown', Bottom: 'cargo:Stone', Shoes: 'trainers:White', Layer: 'overshirt:Olive', Accessory: 'beanie:Olive' } },
  { name: 'Gym Essentials', look: 'Gym', pieces: { Top: 'tee_train:Grey', Bottom: 'shorts_train:Black', Shoes: 'runners:Grey', Layer: 'zip_hoodie:Navy', Accessory: 'holdall:Black' } },
  { name: 'Monochrome Training', look: 'Gym', pieces: { Top: 'tank:Black', Bottom: 'joggers:Black', Shoes: 'canvas:Black', Layer: 'qzip:Black', Accessory: 'cap:Black' } },
];

const BUILDS = ['Average', 'Shorter', 'Tall', 'Slim', 'Broad shoulders', 'Athletic', 'Carrying some weight'];

const BUILD_NOTES = {
  Shorter: {
    Top: 'Ends at the hip. Longer tops cut your legs short.',
    Bottom: 'Slim with no bunching at the ankle. A clean hem adds height.',
    Shoes: 'Close in tone to the trousers so the leg line keeps going.',
    Layer: 'Stops at the waist, which makes your legs look longer.',
    Accessory: 'Kept small. Big accessories swamp a shorter frame.',
  },
  Tall: {
    Top: 'A bit of texture or colour up top balances the length.',
    Bottom: 'Full length, no cropped hems that show too much ankle.',
    Shoes: 'Some contrast at the foot grounds a long frame.',
    Layer: 'Can go longer. Hip length suits your proportions.',
    Accessory: 'You can carry slightly bigger pieces.',
  },
  Slim: {
    Top: 'Heavier fabric adds bulk where you want it.',
    Bottom: 'Straight rather than skinny so your legs don’t look thin.',
    Shoes: 'A bit of weight at the shoe balances a slim leg.',
    Layer: 'Layering adds width across the shoulders.',
    Accessory: 'Keeps the eye moving across your frame.',
  },
  'Broad shoulders': {
    Top: 'Clean at the shoulder, no padding. Your frame does the work.',
    Bottom: 'A bit of room in the leg balances the width up top.',
    Shoes: 'Solid shoe so the bottom half doesn’t look slight.',
    Layer: 'Soft shoulder so you don’t look boxed in.',
    Accessory: 'Simple. The shoulders are already the feature.',
  },
  Athletic: {
    Top: 'Room across the chest, tapered at the waist, shows the V.',
    Bottom: 'Tapered, with enough room at the thigh.',
    Shoes: 'Clean and simple, keeps the focus up top.',
    Layer: 'Fitted enough to keep your shape visible.',
    Accessory: 'Watch on the wrist draws the eye to your arms.',
  },
  'Carrying some weight': {
    Top: 'Structured fabric that skims instead of clinging.',
    Bottom: 'Darker colour and a straight leg slims the lower half.',
    Shoes: 'A solid shoe so your feet don’t look small under you.',
    Layer: 'Worn open, it draws a long line down the front.',
    Accessory: 'A dark belt, not one that splits you in half.',
  },
};

const GUIDE = {
  Average: [
    'You can wear most cuts, so fit is what separates you. Tops end at the hip, trousers break once at the shoe.',
    'Build each outfit around one strong piece, a jacket or good shoes, and keep the rest simple.',
  ],
  Shorter: [
    'Wear the same colour or close shades top to bottom. One unbroken column reads taller.',
    'Keep jackets short, at the waist or just below.',
    'Get trousers hemmed so there is no stacking at the ankle.',
    'Boots with a slightly thicker sole add height without looking obvious.',
  ],
  Tall: [
    'Break up your height with contrast: a lighter top and darker trousers.',
    'Longer coats and hip-length layers suit you better than cropped ones.',
    'Watch your sleeve and trouser length. Short hems are the giveaway.',
  ],
  Slim: [
    'Layer. An overshirt or jumper over a tee adds width.',
    'Heavier fabrics like denim, flannel and heavyweight cotton add presence.',
    'Straight or relaxed trousers, not skinny.',
  ],
  'Broad shoulders': [
    'Avoid padded shoulders. You don’t need them.',
    'Open collars break up a wide chest.',
    'Give your trousers some room so your legs don’t look thin under a big top half.',
  ],
  Athletic: [
    'Fit is everything. Tops should fit your chest and taper at the waist.',
    'Stretch in your trousers stops the thigh pulling.',
    'Skip baggy tees. They hide the work you’ve put in.',
  ],
  'Carrying some weight': [
    'Darker colours and matte fabrics slim the frame.',
    'An overshirt or jacket worn open creates a long vertical line.',
    'Right size, not a size up. Too big makes you look bigger.',
  ],
};

const GENERAL_GUIDE = [
  'Fit first. A £15 tee that fits beats a £90 one that doesn’t.',
  'Three colours per outfit, max. Two neutrals and one accent is the safe rule.',
  'Shoes change the whole outfit. Clean shoes matter more than new ones.',
  'Get one thing tailored. Hemming trousers costs about £10 and makes cheap trousers look expensive.',
];
