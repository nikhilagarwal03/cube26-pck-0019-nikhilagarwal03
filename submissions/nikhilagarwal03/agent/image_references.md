# **Batch 1: Baseline Controls & Missing Items** 

# **1.a (Category 1: Perfect Pack - SEAL)** 

**Prompt:** A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box, resting on the bottom, are exactly two folded light blue bath towels side-by-side, and exactly one rectangular bar of lavender soap in purple packaging placed below the towels. The items are clearly separated with no overlap. Studio warehouse lighting, sharp focus, 4k resolution, industrial inventory photography style. --ar 1:1 -- style raw 

# **1.b (Category 2: Missing Item - STOP & FIX)** 

**Prompt:** A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box, resting on the bottom, is exactly one folded light blue bath towel, and exactly one rectangular bar of lavender soap in purple packaging. There is a noticeable empty space where a second towel should be. The items are clearly separated. Studio warehouse lighting, sharp focus, 4k resolution, industrial inventory photography style. --ar 1:1 --style raw 

# **1.c (Category 4: Variant Swap - STOP & FIX)** 

**Prompt:** A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box, resting on the bottom, are exactly two folded dark navy blue bath towels side-by-side, and exactly one rectangular bar of lavender soap in purple packaging. (Note: The towels are distinctly dark navy, not light blue). Studio warehouse lighting, sharp focus, 4k resolution, industrial inventory photography style. --ar 1:1 --style raw 

# **1.d (Category 6: Ambiguous / Occluded - UNCERTAIN)** 

**Prompt:** A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. The contents of the box are heavily obscured by crumpled brown kraft packing paper. Only the corner of one light blue bath towel and a tiny sliver of purple soap packaging are visible peeking out from under the heavy packing paper. Harsh overhead warehouse lighting casting dark shadows inside the box. --ar 1:1 --style raw 

# **Batch 2: Quantity Mismatches & Extra Items** 

# **2.a (Category 3: Wrong Quantity - Too Many - STOP & FIX)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box, resting on the bottom, are exactly three (3) folded light blue bath towels side-by-side, and exactly one rectangular bar of lavender soap in purple packaging. The items are clearly separated. Studio warehouse lighting, sharp focus, 4k resolution, industrial inventory photography style. 

# **2.b (Category 3: Wrong Quantity - Stacked - STOP & FIX)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box are two folded light blue bath towels stacked directly on top of each other so it almost looks like a single thick towel, and exactly one rectangular bar of lavender soap placed next to them. Studio warehouse lighting, sharp focus. 

# **2.c (Category 5: Unexpected Extra Item - STOP & FIX)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box are exactly two folded light blue bath towels and exactly one rectangular bar of lavender soap. Next to the soap, someone has accidentally dropped a yellow plastic tape dispenser. All items are clearly visible. Studio warehouse lighting, sharp focus. 

# **2.d (Category 5: Wrong Item / Complete Mismatch - STOP & FIX)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box are exactly two folded light blue bath towels. However, instead of soap, there is a small black cardboard electronics box. Studio warehouse lighting, sharp focus, industrial inventory photography style. 

# **Batch 3: The Apparel & Hardgoods Catalog** 

# **3.a Perfect Pack (SEAL images)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside are exactly two folded white t-shirts, exactly one plain black ceramic coffee mug, and exactly one paperback book. The items are neatly arranged and clearly separated. Studio warehouse lighting, sharp focus, 4k resolution, industrial inventory photography style. 

# **3.b Missing Item (STOP & FIX images - Missing Mug)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box are exactly two folded white t-shirts and exactly one paperback book. The black coffee mug is completely missing, leaving an empty space. Studio warehouse lighting, sharp focus, industrial inventory photography style. 

# **3.c Variant Swap / Decoy (STOP & FIX images - Red Mug)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside are exactly two folded white t-shirts and exactly one paperback book. However, the coffee mug included is distinctly BRIGHT RED instead of black. Studio warehouse lighting, sharp focus, industrial inventory photography style. 

# **3.d Wrong Quantity (STOP & FIX images - 3 Shirts)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside the box are exactly THREE folded white t-shirts stacked slightly overlapping, exactly one black ceramic coffee mug, and exactly one paperback book. Studio warehouse lighting, sharp focus. 

# **3.e Unexpected Extra Item (STOP & FIX images - Keychain)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. Inside are exactly two folded white t-shirts, exactly one black ceramic coffee mug, and exactly one paperback book. Next to the mug, someone has accidentally dropped a set of silver metal keys. Studio warehouse lighting, sharp focus. 

# **3.f Severe Occlusion (UNCERTAIN images)** 

A photorealistic top-down view looking directly inside an open, standard brown corrugated cardboard shipping box. The contents are heavily covered by thick plastic bubble wrap. You can only barely see the handle of a black mug and the white fabric edge of a t-shirt peeking out from under the heavy bubble wrap. Harsh overhead warehouse lighting casting dark shadows. 

# **General Technical Constraints (Apply to ALL prompts below)** 

**Style:** Photorealistic, high-resolution, sharp focus, zero depth of field blur across the items. **Angle:** 100% Top-down view (Flat lay/Nadire), looking directly perpendicular into the box. **Lighting:** Bright, even, industrial warehouse lighting. No harsh shadows, no artistic lighting. **Container:** A standard brown corrugated cardboard box, open flaps folded back, resting on a neutral cement floor. 

# **Batch 4: Grocery & Reflected Packaging** 

**Goal:** Test model ability to count rounded objects and handle glare on plastic packaging. 

# **4a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one standard cylindrical red aluminum can of diced tomatoes with a white paper label showing a photo of a tomato, exactly one rectangular yellow plastic-wrapped package of spaghetti pasta, and exactly two small glass jars of dried basil with green metal lids, placed side-by-side. The items are neatly arranged on the cardboard bottom. Sharp focus on all labels. Industrial lighting. 

# **4b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one cylindrical red aluminum can of diced tomatoes and exactly one rectangular yellow plasticwrapped package of spaghetti pasta. The glass jars of basil are completely missing, leaving a visible, distinct empty space showing the bare cardboard bottom. Harsh, even lighting. 

# **4c. Quantity Too Few (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one cylindrical red aluminum can of diced tomatoes and exactly one rectangular yellow plasticwrapped package of spaghetti pasta. There is only ONE glass jar of dried basil with a green metal lid. The space next to it is empty. Sharp focus. 

# **4d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly two glass jars of dried basil and exactly one yellow plastic-wrapped package of spaghetti pasta. However, instead of a can of tomatoes, there is a distinct metal can of canned pineapple with a blue and yellow label. Top-down view, crisp focus. 

# **4e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one can of diced tomatoes, one package of spaghetti pasta, and two jars of dried basil. Lying 

randomly in the corner of the box is an unexpected green apple, creating a packing error. Sharp focus. 

# **4f. Heavy Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the items are heavily covered by crinkled brown kraft packing paper. Only the rounded red metal lid of the tomato can and a tiny edge of the yellow pasta package are visible peeking out. The glass jars are completely obscured. The lighting creates deep shadows under the paper. 

# **Batch 5: Apparel & Stacking** 

**Goal:** Test detection of flexible, soft objects that may overlap or stack slightly. 

# **5a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one folded plain heather grey cotton hoodie sweatshirt and exactly one pair of black crew socks packaged together with a small cardboard header card. The items are lying side-by-side, perfectly flat. Crisp texture detail on the fabric. Uniform lighting. 

# **5b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is only exactly one folded heather grey cotton hoodie sweatshirt. The black crew socks are completely missing. A large, visible area of the cardboard box bottom is empty. Perpendicular top-down view. 

# **5c. Quantity Too Many / Overstack (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is exactly one folded plain heather grey cotton hoodie sweatshirt. There are exactly TWO pairs of black crew socks with header cards, lying on top of each other. The texture of the top sock slightly obscures the one beneath it. Sharp focus. 

# **5d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is exactly one pair of black crew socks. However, instead of a grey hoodie, there is a distinct folded BRIGHT NAVY BLUE polo shirt. Top-down view, texture details on both fabrics. Uniform industrial lighting. 

# **5e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one folded heather grey hoodie and one pair of black socks. Lying loosely next to the hoodie is an unexpected, coiled brown leather belt with a silver buckle. Creating a messy, erroneous pack. Crisp focus. 

# **5f. Severe Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the fabric items are nearly entirely covered by loose, crumpled white tissue paper filling. You can only perceive the very small edge of the grey hoodie and a glimpse of the black sock fabric through gaps in the paper. Diffuse lighting, sharp focus on the packing material. 

# **Batch 6: Hardgoods (Books & Media)** 

**Goal:** Test detection of rigid rectangles with high-detail text/cover art. 

# **6a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one large hardcover fictional book with a glossy, colorful space-themed dust jacket, and exactly two standard plastic DVD cases (e.g., "The Matrix" and "Inception"), lying flat. The items are neatly arranged without overlap. Sharp focus on all titles. 

# **6b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is only exactly one large hardcover fictional book with a space-themed dust jacket. The two DVD cases are entirely missing. Empty space showing the cardboard bottom. Top-down perpendicular view. Industrial lighting. 

# **6c. Quantity Too Few (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is exactly one large hardcover fictional book and only exactly ONE plastic DVD case. The space where the second DVD case should be is empty. Crisp focus on the visible titles. 

# **6d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly two plastic DVD cases. However, instead of the large hardcover book, there is a distinctly smaller paperback book with a plain white cover and black text, creating a mismatch. Top-down view. 

# **6e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one large hardcover book and two plastic DVD cases. Tucked between the book and the DVD is an unexpected coiled pair of black wired earphones. Sharp focus on all object textures. 

# **6f. Severe Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the items are heavily buried under green, crinkle-cut shredded paper filling. Only the spine of the hardcover book is visible, and perhaps a small plastic corner of a DVD case. Titles are unreadable due to cover material. Even lighting. 

# **Batch 7: Tools & Reflector Surfaces** 

**Goal:** Test model behavior with highly reflective metal and complex shapes. 

# **7a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one silver metal claw hammer with a distinct black rubber handle and exactly one bright orange plastic tape measure with a visible metal clip. They are lying separately on the cardboard surface. Direct top-down view, sharp focus. Industrial warehouse lighting. 

# **7b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is only exactly one bright orange plastic tape measure. The silver claw hammer is completely missing. Perpendicular view, clear look at the empty cardboard bottom adjacent to the tape measure. 

# **7c. Quantity Too Many (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is exactly one silver metal claw hammer. There are exactly TWO bright orange plastic tape measures, lying side-by-side. The counts are visually distinct. Sharp focus, even lighting. 

# **7d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is exactly one bright orange plastic tape measure. However, instead of a standard silver hammer, there is a distinct rubber mallet with a large black head and wood handle. Different shape and material. Top-down view. 

# **7e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one silver hammer and one orange tape measure. Tucked into the corner is an unexpected handful of loose silver screws and nails scattered directly onto the cardboard bottom. Crisp focus, specular reflections on the metal surfaces. 

# **7f. Severe Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the metal tools are nearly entirely covered by loose sheets of brown kraft packing paper. You can only barely discern the end of the black hammer handle and perhaps a glimpse of the orange plastic casing through paper gaps. No clear identification possible. 

# **Batch 8: Small Items (Cosmetics)** 

**Goal:** Test model ability to detect small asset sizes and complex shapes (bottles/jars). 

# **8a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one cylindrical glass bottle of clear lotion with a silver pump lid, exactly one small round white plastic cream jar with a black screw lid, and exactly one small rectangular cardboard box containing a tube of lipstick (logo visible). Neatly arranged, sharp focus on small text. 

# **8b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one small round white plastic cream jar and one small rectangular lipstick box. The cylindrical lotion bottle is completely missing. Visibly empty bare cardboard space. Top-down perpendicular view. 

# **8c. Quantity Too Few (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is only exactly one rectangular lipstick box and only exactly ONE cylindrical lotion bottle. The small cream jar is missing. Visible space. Sharp focus on visible small labels. Uniform lighting. 

# **8d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly the glass lotion bottle and the round cream jar. However, instead of the cardboard lipstick box, there is a distinct, small square compact mirror lying flat. Different packaging format. Top-down view. 

# **8e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly the glass lotion bottle, the cream jar, and the lipstick box. Lying randomly between them is an unexpected blue makeup sponge, creating a messy packing error. Sharp focus on all object details. 

# **8f. Severe Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the small cosmetics are buried deeply under a pile of pink crinkle-cut shredded paper filling. Only the very tip of the silver pump from the lotion bottle is visible peeking through. Identifications are impossible. Bright, even lighting. 

# **Batch 9: Stationery (High Density)** 

**Goal:** Test detection of varying lengths and higher density packs. 

# **9a. Perfect Pack (SEAL)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one black rectangular pencil case (zippered), exactly one yellow spiral-bound notepad lying flat, and exactly one set of six colorful markers in a clear plastic blister pack. Items are neatly arranged on the cardboard bottom. Specular highlights on plastic blister. Sharp focus. 

# **9b. Missing Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box is only exactly one black zippered pencil case and exactly one yellow spiral notepad. The colorful markers set is entirely missing. Perpendicular top-down view showing a large empty bare cardboard area. Uniform lighting. 

# **9c. Quantity Too Many / Overlap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly one black zippered pencil case and exactly one yellow spiral notepad. There are exactly TWO clear plastic blister packs of markers, slightly overlapping each other, showing a excess of objects. Sharp focus. 

# **9d. Wrong Item / Variant Swap (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are the black pencil case and the colorful markers set. However, instead of a yellow spiral notepad, there is a distinct smaller green composition notebook with a classic marbled cover. Different format. Top-down view. 

# **9e. Extra Item (STOP & FIX)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box are exactly the black pencil case, the yellow notepad, and the marker set. Lying loosely across the notepad are unexpected, large silver metal scissors with red handles. Creating a messy, erroneous pack. Crisp focus. 

# **9f. Severe Occlusion (UNCERTAIN)** 

**Detailed Prompt:** (General constraints apply) Inside the open brown cardboard box, the stationery items are almost entirely covered by thick plastic bubble wrap. No items are clearly identifiable, only warped shapes and colors are diffused through the plastic. Minimal specularity on the bubble wrap itself. Industrial lighting. 

