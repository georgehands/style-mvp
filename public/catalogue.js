// Sample catalogue standing in for the AI + live shop search. Prices are illustrative.
const SLOTS = ['Top', 'Bottom', 'Shoes', 'Layer', 'Accessory'];

const item = (slot, name, colour, hex, fit, price, shop, why) => ({ slot, name, colour, hex, fit, price, shop, why });

const ITEMS = {
  t_tee_white: item('Top', 'Heavyweight tee', 'White', '#F1EEE6', 'Regular, ends at the hip', 15, 'Uniqlo', 'Thick cotton holds its shape, so it looks sharp instead of sloppy.'),
  t_tee_black: item('Top', 'Boxy heavyweight tee', 'Black', '#1C1C1C', 'Boxy, slightly cropped', 20, 'H&M', 'Boxy and heavy is the base of the whole streetwear look.'),
  t_oxford: item('Top', 'Oxford shirt', 'Light blue', '#BFD3E6', 'Slim', 30, 'Uniqlo', 'Works buttoned or open over a tee. One piece, two looks.'),
  t_polo_navy: item('Top', 'Knitted polo', 'Navy', '#1F2A44', 'Fitted', 35, 'Zara', 'Smarter than a tee, easier than a shirt. The fastest upgrade there is.'),
  t_polo_cream: item('Top', 'Knitted polo', 'Cream', '#E8DFCC', 'Fitted', 35, 'Zara', 'Soft, pale and logo-free. The quiet money look in one piece.'),
  t_shirt_black: item('Top', 'Slim shirt', 'Black', '#161616', 'Slim, sleeves rolled', 30, 'Zara', 'Black near the face looks sharp in low light.'),
  t_hoodie: item('Top', 'Plain hoodie', 'Grey marl', '#9A9A9A', 'Relaxed', 30, 'Uniqlo', 'No logos, good weight. Looks more expensive than it is.'),
  t_train: item('Top', 'Training tee', 'Black', '#1E1E1E', 'Athletic cut', 20, 'Gymshark', 'Close through the chest and arms, room at the waist.'),
  t_muscle: item('Top', 'Muscle-fit tee', 'Stone', '#BDB5A6', 'Short sleeve, fitted', 22, 'Gymshark', 'A shorter sleeve sits higher on the arm.'),

  b_jeans_dark: item('Bottom', 'Straight jeans', 'Dark indigo', '#26324A', 'Straight', 40, "Levi's", 'Dark wash reads sharper than light and goes with nearly everything.'),
  b_jeans_black: item('Bottom', 'Straight jeans', 'Black', '#1E1E1E', 'Slim straight', 40, "Levi's", 'Black denim dresses up or down in one move.'),
  b_chinos: item('Bottom', 'Tapered chinos', 'Stone', '#C8BBA0', 'Slim tapered', 30, 'Uniqlo', 'The taper cleans up the line from hip to ankle.'),
  b_trousers: item('Bottom', 'Tailored trousers', 'Charcoal', '#3A3B3F', 'Slim', 45, 'Zara', 'Proper trousers do more for looking put together than anything else.'),
  b_pleated: item('Bottom', 'Pleated trousers', 'Cream', '#DCD3C0', 'Relaxed taper', 40, 'Mango', 'A little volume up top, clean at the ankle.'),
  b_cargo: item('Bottom', 'Cargo trousers', 'Olive', '#4E5238', 'Relaxed straight', 40, 'H&M', 'Relaxed on top, stacks slightly at the shoe.'),
  b_shorts: item('Bottom', '7-inch shorts', 'Charcoal', '#333333', 'Above the knee', 20, 'Gymshark', 'Above the knee looks more athletic.'),
  b_joggers: item('Bottom', 'Tapered joggers', 'Black', '#1C1C1C', 'Tapered, cuffed', 30, 'Nike', 'Clean enough to wear to and from the gym.'),

  s_white: item('Shoes', 'Leather trainers', 'White', '#F2F2EE', 'Low profile', 45, 'ASOS', 'The one shoe that makes almost any outfit look deliberate.'),
  s_loafers: item('Shoes', 'Suede loafers', 'Brown', '#6B4A2F', 'Classic', 55, 'ASOS', 'Dressy without being formal. Sockless in summer.'),
  s_chelsea: item('Shoes', 'Chelsea boots', 'Black', '#1A1A1A', 'Slim toe', 65, 'ASOS', 'Sleek, and they add a bit of height.'),
  s_desert: item('Shoes', 'Desert boots', 'Sand', '#B89A72', 'Ankle height', 30, 'Vinted (used)', 'Softer than trainers, still easy. Secondhand keeps it cheap.'),
  s_skate: item('Shoes', 'Canvas skate shoes', 'Black', '#222222', 'Low top', 60, 'Vans', 'Flat and simple, goes with every streetwear piece.'),
  s_flat: item('Shoes', 'Flat canvas trainers', 'White', '#F0F0EC', 'Flat sole', 55, 'Converse', 'Stable for lifting, and fine outside the gym.'),
  s_run: item('Shoes', 'Running trainers', 'Grey', '#8E9296', 'Cushioned', 70, 'ASICS', 'If you do cardio, this is the pair that does it all.'),

  l_overshirt: item('Layer', 'Overshirt', 'Olive', '#5B5E3C', 'Boxy, hip length', 35, 'H&M', 'Adds shape across the shoulders without bulk.'),
  l_denim: item('Layer', 'Denim jacket', 'Mid blue', '#5A7598', 'Cropped at the waist', 40, 'H&M', 'A classic that never looks like you tried too hard.'),
  l_merino: item('Layer', 'Merino jumper', 'Navy', '#243049', 'Fitted crew neck', 35, 'Uniqlo', 'Thin enough to layer, smart enough for work.'),
  l_cable: item('Layer', 'Cable-knit jumper', 'Cream', '#E6DCC6', 'Regular', 40, 'Vinted (used)', 'Texture reads expensive. Over the shoulders if it’s warm.'),
  l_blazer: item('Layer', 'Unstructured blazer', 'Navy', '#26324A', 'Soft shoulder', 80, 'Zara', 'Instant structure through the shoulders, no stiff suit feel.'),
  l_bomber: item('Layer', 'Bomber jacket', 'Black', '#202020', 'Cropped at the waist', 40, 'ASOS', 'Short length keeps the legs looking long.'),
  l_qzip: item('Layer', 'Quarter-zip', 'Grey', '#7D7F83', 'Fitted', 35, 'Gymshark', 'Warm-up layer that still shows your shape.'),
  l_zip: item('Layer', 'Zip hoodie', 'Navy', '#1F2A44', 'Regular', 30, 'Uniqlo', 'Simple, and it goes over anything.'),

  a_watch_steel: item('Accessory', 'Steel watch', 'Silver', '#BFC3C7', 'Small face', 25, 'Casio', 'A watch is the cheapest signal that you thought about it.'),
  a_watch_leather: item('Accessory', 'Leather strap watch', 'Tan', '#A0703F', 'Slim case', 30, 'Timex', 'Ties the belt and shoes together.'),
  a_belt: item('Accessory', 'Leather belt', 'Brown', '#5C3A21', '3cm width', 18, 'M&S', 'Finishes the waist so the outfit reads as one.'),
  a_cap: item('Accessory', 'Plain cap', 'Black', '#1A1A1A', 'Curved peak', 15, 'Nike', 'Keeps it simple on a bad hair day.'),
  a_beanie: item('Accessory', 'Beanie', 'Charcoal', '#3A3A3A', 'Short, above the ear', 12, 'ASOS', 'Frames the face and finishes the look.'),
  a_bag: item('Accessory', 'Holdall', 'Black', '#222222', 'Medium', 25, 'Decathlon', 'One tidy bag beats a rucksack stuffed with kit.'),
  a_scent: item('Accessory', 'Fragrance', 'Fresh, woody', '#C9B79C', '30ml', 30, 'Zara', 'People notice it before they notice the outfit. Two sprays, not five.'),
};

// First option in each slot is the default pick.
const LOOKS = {
  Casual: {
    tint: '#56654A',
    tagline: 'Weekends, errands, the pub.',
    options: { Top: ['t_tee_white', 't_oxford', 't_hoodie'], Bottom: ['b_jeans_dark', 'b_chinos'], Shoes: ['s_white', 's_desert'], Layer: ['l_overshirt', 'l_denim'], Accessory: ['a_watch_steel', 'a_belt'] },
  },
  'Smart Casual': {
    tint: '#2F3E56',
    tagline: 'Work, dinners, anywhere a tee won’t cut it.',
    options: { Top: ['t_oxford', 't_polo_navy'], Bottom: ['b_chinos', 'b_trousers', 'b_jeans_dark'], Shoes: ['s_white', 's_loafers', 's_chelsea'], Layer: ['l_merino', 'l_blazer'], Accessory: ['a_watch_leather', 'a_belt'] },
  },
  'Old Money': {
    tint: '#7A5C3A',
    tagline: 'Quiet, expensive-looking, no logos.',
    options: { Top: ['t_polo_cream', 't_oxford', 't_polo_navy'], Bottom: ['b_pleated', 'b_chinos'], Shoes: ['s_loafers', 's_white'], Layer: ['l_cable', 'l_merino', 'l_blazer'], Accessory: ['a_watch_leather', 'a_belt'] },
  },
  Streetwear: {
    tint: '#2A2A2A',
    tagline: 'Relaxed fits, clean trainers, no big logos.',
    options: { Top: ['t_tee_black', 't_hoodie'], Bottom: ['b_cargo', 'b_jeans_black'], Shoes: ['s_white', 's_skate'], Layer: ['l_bomber', 'l_overshirt'], Accessory: ['a_beanie', 'a_cap', 'a_watch_steel'] },
  },
  'Night Out': {
    tint: '#5E2230',
    tagline: 'Dinners, drinks, nights out.',
    options: { Top: ['t_shirt_black', 't_polo_navy'], Bottom: ['b_jeans_black', 'b_jeans_dark', 'b_trousers'], Shoes: ['s_chelsea', 's_loafers', 's_white'], Layer: ['l_bomber', 'l_blazer', 'l_merino'], Accessory: ['a_scent', 'a_watch_leather'] },
  },
  Gym: {
    tint: '#3F5263',
    tagline: 'Training, and looking good doing it.',
    options: { Top: ['t_train', 't_muscle'], Bottom: ['b_shorts', 'b_joggers'], Shoes: ['s_flat', 's_run'], Layer: ['l_qzip', 'l_zip'], Accessory: ['a_cap', 'a_bag'] },
  },
};

const LOOK_ORDER = Object.keys(LOOKS);

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
