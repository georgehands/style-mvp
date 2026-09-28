// Sample catalogue standing in for the AI + live shop search. Prices are illustrative.
const SLOTS = ['Top', 'Bottom', 'Shoes', 'Layer', 'Accessory'];

const LANES = ['Casual', 'Smart', 'Streetwear', 'Gym', 'Retro', 'Motorbike'];

const CATALOGUE = {
  Casual: {
    Top: [
      { name: 'Heavyweight crew tee', colour: 'Off-white', hex: '#EEEAE0', fit: 'Regular, ends at the hip', price: 15, shop: 'Uniqlo', why: 'Thick cotton holds its shape, so it looks structured instead of sloppy.' },
      { name: 'Oxford shirt', colour: 'Light blue', hex: '#BFD3E6', fit: 'Slim', price: 30, shop: 'Uniqlo', why: 'Works buttoned or open over a tee. One piece, two looks.' },
    ],
    Bottom: [
      { name: 'Straight dark jeans', colour: 'Indigo', hex: '#26324A', fit: 'Straight', price: 40, shop: "Levi's", why: 'Dark wash reads sharper than light and goes with everything else here.' },
      { name: 'Tapered chinos', colour: 'Stone', hex: '#C8BBA0', fit: 'Slim tapered', price: 30, shop: 'Uniqlo', why: 'The taper cleans up the line from hip to ankle.' },
    ],
    Shoes: [
      { name: 'White leather trainers', colour: 'White', hex: '#F2F2EE', fit: 'Low profile', price: 45, shop: 'ASOS', why: 'The one shoe that makes a casual outfit look deliberate.' },
      { name: 'Suede desert boots', colour: 'Sand', hex: '#B89A72', fit: 'Ankle height', price: 30, shop: 'Vinted (used)', why: 'Softer than trainers, still easy. Secondhand keeps it cheap.' },
    ],
    Layer: [
      { name: 'Overshirt', colour: 'Olive', hex: '#5B5E3C', fit: 'Boxy, hip length', price: 35, shop: 'H&M', why: 'Adds shape across the shoulders without adding bulk.' },
      { name: 'Denim jacket', colour: 'Mid blue', hex: '#5A7598', fit: 'Regular, cropped at the waist', price: 40, shop: 'H&M', why: 'A classic that never looks like you tried too hard.' },
    ],
    Accessory: [
      { name: 'Steel digital watch', colour: 'Silver', hex: '#BFC3C7', fit: 'Small face', price: 25, shop: 'Casio', why: 'A watch is the cheapest signal that you thought about it.' },
      { name: 'Leather belt', colour: 'Dark brown', hex: '#4A3222', fit: '3cm width', price: 18, shop: 'M&S', why: 'Finishes the waist so the outfit reads as one piece.' },
    ],
  },
  Smart: {
    Top: [
      { name: 'Knitted polo', colour: 'Navy', hex: '#1F2A44', fit: 'Fitted', price: 35, shop: 'Zara', why: 'Smarter than a tee, easier than a shirt. The fastest upgrade there is.' },
      { name: 'Crisp white shirt', colour: 'White', hex: '#FAFAFA', fit: 'Slim', price: 30, shop: 'M&S', why: 'Clean and bright near your face, works with any trouser.' },
    ],
    Bottom: [
      { name: 'Wool-blend trousers', colour: 'Charcoal', hex: '#3A3B3F', fit: 'Slim', price: 45, shop: 'Zara', why: 'Proper trousers do more for looking put together than anything else.' },
      { name: 'Pleated trousers', colour: 'Taupe', hex: '#8C7E6D', fit: 'Relaxed taper', price: 40, shop: 'Mango', why: 'A bit of volume at the top, clean at the ankle. Looks current.' },
    ],
    Shoes: [
      { name: 'Leather loafers', colour: 'Brown', hex: '#5C3A21', fit: 'Classic', price: 60, shop: 'ASOS', why: 'Dressy without being formal, and they work sockless in summer.' },
      { name: 'Chelsea boots', colour: 'Black', hex: '#1A1A1A', fit: 'Slim toe', price: 65, shop: 'ASOS', why: 'Sleek and they add a little height.' },
    ],
    Layer: [
      { name: 'Merino crew jumper', colour: 'Camel', hex: '#B08A5B', fit: 'Fitted', price: 35, shop: 'Uniqlo', why: 'Thin enough to layer, warm tone flatters most skin.' },
      { name: 'Unstructured blazer', colour: 'Navy', hex: '#243049', fit: 'Soft shoulder', price: 80, shop: 'Zara', why: 'Instant structure through the shoulders, no stiff suit feeling.' },
    ],
    Accessory: [
      { name: 'Leather strap watch', colour: 'Tan', hex: '#A0703F', fit: 'Slim case', price: 30, shop: 'Timex', why: 'Matches the shoes, ties the outfit together.' },
      { name: 'Leather belt', colour: 'Brown', hex: '#5C3A21', fit: '3cm width', price: 18, shop: 'M&S', why: 'Match it to the shoes and the whole thing looks planned.' },
    ],
  },
  Streetwear: {
    Top: [
      { name: 'Boxy heavyweight tee', colour: 'Black', hex: '#1C1C1C', fit: 'Boxy, slightly cropped', price: 20, shop: 'H&M', why: 'Boxy and heavy is the base of the whole look.' },
      { name: 'Plain hoodie', colour: 'Grey marl', hex: '#9A9A9A', fit: 'Relaxed', price: 30, shop: 'Uniqlo', why: 'No logos, good weight. Looks more expensive than it is.' },
    ],
    Bottom: [
      { name: 'Cargo trousers', colour: 'Olive', hex: '#4E5238', fit: 'Relaxed straight', price: 40, shop: 'H&M', why: 'Relaxed on top, stacks slightly at the shoe.' },
      { name: 'Carpenter trousers', colour: 'Charcoal', hex: '#3D3D3D', fit: 'Relaxed straight', price: 45, shop: 'Dickies', why: 'Workwear fabric, holds a sharp shape.' },
    ],
    Shoes: [
      { name: 'Canvas skate shoes', colour: 'Black', hex: '#222222', fit: 'Low top', price: 60, shop: 'Vans', why: 'Flat and simple, goes with every piece here.' },
      { name: 'Chunky retro runners', colour: 'Grey', hex: '#D0D0CC', fit: 'Chunky sole', price: 70, shop: 'Vinted (used)', why: 'Bulk at the shoe balances wider trousers.' },
    ],
    Layer: [
      { name: 'Nylon bomber', colour: 'Black', hex: '#202020', fit: 'Cropped at the waist', price: 40, shop: 'ASOS', why: 'Short length keeps your legs looking long under baggy trousers.' },
      { name: 'Work jacket', colour: 'Tan', hex: '#9C7A4E', fit: 'Boxy', price: 60, shop: 'Dickies', why: 'Adds colour without being loud.' },
    ],
    Accessory: [
      { name: 'Beanie', colour: 'Charcoal', hex: '#3A3A3A', fit: 'Short, sits above the ear', price: 12, shop: 'ASOS', why: 'Frames the face and finishes the look.' },
      { name: 'Crossbody bag', colour: 'Black', hex: '#1A1A1A', fit: 'Small', price: 20, shop: 'ASOS', why: 'Useful, and it breaks up the torso.' },
    ],
  },
  Gym: {
    Top: [
      { name: 'Fitted training tee', colour: 'Black', hex: '#1E1E1E', fit: 'Athletic cut', price: 20, shop: 'Gymshark', why: 'Close fit through the chest and arms, room at the waist.' },
      { name: 'Muscle-fit tee', colour: 'Stone', hex: '#BDB5A6', fit: 'Short sleeve, fitted', price: 22, shop: 'Gymshark', why: 'Short sleeve sits higher on the arm.' },
    ],
    Bottom: [
      { name: '7-inch training shorts', colour: 'Charcoal', hex: '#333333', fit: 'Above the knee', price: 20, shop: 'Gymshark', why: 'Above the knee shows your legs and looks more athletic.' },
      { name: 'Tapered joggers', colour: 'Black', hex: '#1C1C1C', fit: 'Tapered, cuffed', price: 30, shop: 'Nike', why: 'Clean enough to wear to and from the gym.' },
    ],
    Shoes: [
      { name: 'Flat canvas trainers', colour: 'White', hex: '#F0F0EC', fit: 'Flat sole', price: 55, shop: 'Converse', why: 'Flat and stable for lifting, and they look good outside it.' },
      { name: 'Running trainers', colour: 'Grey', hex: '#8E9296', fit: 'Cushioned', price: 70, shop: 'ASICS', why: 'If you do cardio, this is the one pair that does it all.' },
    ],
    Layer: [
      { name: 'Quarter-zip', colour: 'Grey', hex: '#7D7F83', fit: 'Fitted', price: 35, shop: 'Gymshark', why: 'Warm-up layer that still shows your shape.' },
      { name: 'Zip hoodie', colour: 'Navy', hex: '#1F2A44', fit: 'Regular', price: 30, shop: 'Uniqlo', why: 'Simple and it goes over anything.' },
    ],
    Accessory: [
      { name: 'Plain cap', colour: 'Black', hex: '#1A1A1A', fit: 'Curved peak', price: 15, shop: 'Nike', why: 'Keeps it simple on a bad hair day.' },
      { name: 'Holdall bag', colour: 'Black', hex: '#222222', fit: 'Medium', price: 25, shop: 'Decathlon', why: 'One tidy bag beats a rucksack stuffed with kit.' },
    ],
  },
  Retro: {
    Top: [
      { name: 'Striped knit polo', colour: 'Cream and brown', hex: '#E8DDC4', fit: 'Regular', price: 28, shop: 'Vinted (used)', why: 'The easiest 70s nod that still looks wearable.' },
      { name: 'Camp-collar shirt', colour: 'Mustard', hex: '#C9A13B', fit: 'Boxy, short sleeve', price: 25, shop: 'Vinted (used)', why: 'Open collar frames the neck and shoulders.' },
    ],
    Bottom: [
      { name: 'Straight light-wash jeans', colour: 'Light blue', hex: '#8FA7C2', fit: 'Straight', price: 20, shop: 'Vinted (used)', why: 'Old denim fades better than new. Cheap secondhand.' },
      { name: 'Wide-leg cords', colour: 'Brown', hex: '#6B4A2F', fit: 'Wide leg', price: 35, shop: 'ASOS', why: 'Texture and warmth, very on-trend right now.' },
    ],
    Shoes: [
      { name: 'Low terrace trainers', colour: 'White and green', hex: '#EDEDE6', fit: 'Slim, low profile', price: 70, shop: 'Adidas', why: 'Slim retro trainers keep the whole outfit sharp.' },
      { name: 'Penny loafers', colour: 'Oxblood', hex: '#5A1E1E', fit: 'Classic', price: 45, shop: 'Vinted (used)', why: 'Proper 60s energy, and they dress up denim.' },
    ],
    Layer: [
      { name: 'Harrington jacket', colour: 'Navy', hex: '#243049', fit: 'Cropped at the waist', price: 45, shop: 'Vinted (used)', why: 'Short and clean, it lengthens the legs.' },
      { name: 'Suede jacket', colour: 'Tan', hex: '#A57A4F', fit: 'Regular', price: 60, shop: 'Vinted (used)', why: 'The statement piece. Everything else stays quiet around it.' },
    ],
    Accessory: [
      { name: 'Tinted sunglasses', colour: 'Brown tint', hex: '#6B4A2F', fit: 'Medium frame', price: 15, shop: 'ASOS', why: 'Pulls the whole retro thing together instantly.' },
      { name: 'Thin chain', colour: 'Gold tone', hex: '#C9A13B', fit: 'Short', price: 15, shop: 'ASOS', why: 'Sits at the open collar. Small detail, big effect.' },
    ],
  },
  Motorbike: {
    Top: [
      { name: 'Henley', colour: 'Charcoal', hex: '#3A3A3A', fit: 'Fitted', price: 25, shop: 'Uniqlo', why: 'Rugged but clean, shows the chest and shoulders.' },
      { name: 'Flannel shirt', colour: 'Red check', hex: '#7A2E2A', fit: 'Regular', price: 30, shop: 'H&M', why: 'Classic garage look, works open over a tee.' },
    ],
    Bottom: [
      { name: 'Black straight jeans', colour: 'Black', hex: '#1E1E1E', fit: 'Slim straight', price: 40, shop: "Levi's", why: 'Tough, clean, goes with the boots.' },
      { name: 'Raw dark denim', colour: 'Deep indigo', hex: '#1E2536', fit: 'Slim straight', price: 60, shop: "Levi's", why: 'Fades to you over time. Looks better every month.' },
    ],
    Shoes: [
      { name: 'Leather work boots', colour: 'Dark brown', hex: '#3E2717', fit: 'Chunky sole', price: 70, shop: 'Vinted (used)', why: 'The anchor of the look, and the sole adds height.' },
      { name: 'Chelsea boots', colour: 'Black', hex: '#1A1A1A', fit: 'Slim', price: 65, shop: 'ASOS', why: 'Sleeker option that still says motorbike.' },
    ],
    Layer: [
      { name: 'Leather jacket', colour: 'Black', hex: '#141414', fit: 'Cropped at the waist, fitted', price: 120, shop: 'Vinted (used)', why: 'The whole point. Secondhand leather already looks broken in.' },
      { name: 'Waxed jacket', colour: 'Olive', hex: '#4A4B32', fit: 'Regular', price: 90, shop: 'Vinted (used)', why: 'British and practical, softer than full leather.' },
    ],
    Accessory: [
      { name: 'Brass buckle belt', colour: 'Black', hex: '#1A1A1A', fit: '4cm width', price: 20, shop: 'ASOS', why: 'Heavy belt matches heavy boots.' },
      { name: 'Bandana', colour: 'Navy', hex: '#243049', fit: 'Folded at the neck', price: 8, shop: 'ASOS', why: 'Cheap and it adds character.' },
    ],
  },
};

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
    Layer: 'Layering is your best friend. It adds width across the shoulders.',
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
    Layer: 'Worn open, it draws a long vertical line down the front.',
    Accessory: 'A belt in a dark colour, not one that splits you in half.',
  },
};

const GUIDE = {
  Average: [
    'You can wear most cuts, so fit is what separates you. Tops end at the hip, trousers break just once at the shoe.',
    'Build your outfits around one strong piece, a jacket or a pair of boots, and keep the rest simple.',
  ],
  Shorter: [
    'Wear the same colour or close shades top to bottom. One unbroken column reads taller.',
    'Keep jackets short, at the waist or just below.',
    'Get trousers hemmed so there is no stacking at the ankle.',
    'Low-profile shoes with a small heel, or boots with a thicker sole, add height without looking obvious.',
  ],
  Tall: [
    'Break up your height with contrast: a lighter top and darker trousers.',
    'Longer coats and hip-length layers suit you better than cropped ones.',
    'Watch your sleeve and trouser length. Short hems are the giveaway on tall guys.',
  ],
  Slim: [
    'Layer. An overshirt or jumper over a tee adds width.',
    'Heavier fabrics like denim, flannel and heavyweight cotton add presence.',
    'Straight or relaxed trousers, not skinny.',
  ],
  'Broad shoulders': [
    'Avoid padded shoulders. You don’t need them.',
    'V-necks and open collars break up a wide chest.',
    'Give your trousers some room so your legs don’t look thin under a big top half.',
  ],
  Athletic: [
    'Fit is everything. Tops should fit your chest and taper at the waist.',
    'Stretch fabrics in trousers stop the thigh pulling.',
    'Avoid baggy tees. They hide the work you’ve put in.',
  ],
  'Carrying some weight': [
    'Darker colours and matte fabrics slim the frame.',
    'Structure over stretch: an overshirt or jacket worn open creates a vertical line.',
    'Avoid anything tight at the stomach or too big overall. Right size, not a size up.',
  ],
};

const GENERAL_GUIDE = [
  'Fit first. A £15 tee that fits beats a £90 one that doesn’t.',
  'Three colours per outfit, max. Two neutrals and one accent is the safe rule.',
  'Shoes change the whole outfit. Clean shoes matter more than new ones.',
  'Get one thing tailored. Hemming trousers costs about £10 and makes cheap trousers look expensive.',
];
