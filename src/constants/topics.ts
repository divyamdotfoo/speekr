const topics = [
  {
    title: "Your Favorite Fruit",
    description:
      "Tell me about a fruit you love! What color is it, how does it taste, and do you peel it or just bite into it?",
    proficiency: 1,
  },
  {
    title: "My School Bag",
    description:
      "What does your bag look like? Mention its color and name three things you always keep inside it.",
    proficiency: 1,
  },
  {
    title: "A Friendly Pet",
    description:
      "Describe a cat or a dog you know. What is its name and what color is its fur?",
    proficiency: 1,
  },
  {
    title: "The Big Blue Sky",
    description:
      "Look out the window and describe the sky right now. Is it sunny, cloudy, or is the moon out?",
    proficiency: 1,
  },
  {
    title: "My Favorite Shirt",
    description:
      "Tell me about the shirt you like best. What color is it and does it have any pictures or patterns on it?",
    proficiency: 1,
  },
  {
    title: "A Tasty Drink",
    description:
      "What do you like to drink when you are thirsty? Tell me if it is hot or cold and if it is sweet.",
    proficiency: 1,
  },
  {
    title: "The Living Room",
    description:
      "Describe where you sit to watch TV. Tell me about the sofa and if there is a rug on the floor.",
    proficiency: 1,
  },
  {
    title: "A Tall Tree",
    description:
      "Think of a tree near your home. Does it have green leaves, flowers, or maybe some fruit hanging from it?",
    proficiency: 1,
  },
  {
    title: "My Best Friend's Face",
    description:
      "Describe what your friend looks like. Do they have long hair, glasses, or a big smile?",
    proficiency: 1,
  },
  {
    title: "A Red Apple",
    description:
      "Imagine you are holding a crisp red apple. Describe how it feels in your hand and the sound it makes when you bite it.",
    proficiency: 1,
  },
  {
    title: "The Kitchen Table",
    description:
      "What is on your table right now? Mention the chairs around it and maybe a bowl or a plate you see.",
    proficiency: 1,
  },
  {
    title: "A Yellow Bus",
    description:
      "Describe a bus you see on the street. Is it big, how many windows does it have, and are there many people inside?",
    proficiency: 1,
  },
  {
    title: "My Cell Phone",
    description:
      "What color is your phone and is the screen big or small? Tell me where you usually keep it.",
    proficiency: 1,
  },
  {
    title: "A Raindrop",
    description:
      "Describe what rain looks like on a window. Is it a small circle of water and does it slide down the glass?",
    proficiency: 1,
  },
  {
    title: "The Sun",
    description:
      "Talk about the sun in the morning. Is it very bright and does it make the room feel warm?",
    proficiency: 1,
  },
  {
    title: "A Cold Ice Cube",
    description:
      "Describe a piece of ice. Is it clear like glass and does it feel very cold and slippery when you touch it?",
    proficiency: 1,
  },
  {
    title: "My Soft Pillow",
    description:
      "Tell me about the pillow you sleep on. Is it white, is it very soft, and do you like to hug it?",
    proficiency: 1,
  },
  {
    title: "A Fast Car",
    description:
      "Describe a car driving past you. What color is it and does it make a loud noise or a quiet hum?",
    proficiency: 1,
  },
  {
    title: "A Little Bird",
    description:
      "Describe a bird in a park. What color are its wings and is it sitting on the grass or a branch?",
    proficiency: 1,
  },
  {
    title: "My Favorite Toy",
    description:
      "Think of a toy from when you were very small. What was it called and what did it look like?",
    proficiency: 1,
  },
  {
    title: "A Clock on the Wall",
    description:
      "Look at a clock and describe it. Is it round or square, and what numbers can you see on it?",
    proficiency: 1,
  },
  {
    title: "A Green Leaf",
    description:
      "Pick up a leaf and describe it. Is it long or wide, and does it feel smooth or rough?",
    proficiency: 1,
  },
  {
    title: "My Water Bottle",
    description:
      "Describe the bottle you use for water. Is it made of plastic or metal, and is it full or empty?",
    proficiency: 1,
  },
  {
    title: "A Happy Face",
    description:
      "Describe what a person looks like when they are happy. Mention their eyes and their mouth.",
    proficiency: 1,
  },
  {
    title: "A Cup of Tea",
    description:
      "Describe a warm cup of tea. Is there steam coming off it and do you see a spoon in the cup?",
    proficiency: 1,
  },
  {
    title: "My Morning Routine",
    description:
      "Walk me through your first hour of the day! What time do you wake up, and what are the first three things you do?",
    proficiency: 2,
  },
  {
    title: "Walking to Work",
    description:
      "Tell me about your commute. Do you walk, drive, or take a bus, and what do you see along the way?",
    proficiency: 2,
  },
  {
    title: "A Typical Lunch",
    description:
      "What do you usually eat for lunch on a workday? Tell me who you eat with and where you sit.",
    proficiency: 2,
  },
  {
    title: "My Family Members",
    description:
      "Tell me about the people you live with. How many are there and what are their names and jobs?",
    proficiency: 2,
  },
  {
    title: "Weekend Chores",
    description:
      "What jobs do you do at home on Saturdays? Tell me if you clean, go shopping, or cook for the family.",
    proficiency: 2,
  },
  {
    title: "A Rainy Day",
    description:
      "What do you do when it's raining outside? Tell me if you stay inside, watch a movie, or read a book.",
    proficiency: 2,
  },
  {
    title: "My Favorite Store",
    description:
      "Where do you like to shop for clothes or food? Describe the shop and tell me why you like going there.",
    proficiency: 2,
  },
  {
    title: "Evening Relaxation",
    description:
      "How do you spend your time after dinner? Tell me if you listen to music, talk to friends, or go for a walk.",
    proficiency: 2,
  },
  {
    title: "A Visit to the Doctor",
    description:
      "Describe what happens when you go to a clinic. Who do you talk to first and what does the doctor ask you?",
    proficiency: 2,
  },
  {
    title: "Using My Computer",
    description:
      "What do you use your computer for every day? Tell me if you write emails, play games, or look at photos.",
    proficiency: 2,
  },
  {
    title: "A Local Park",
    description:
      "Describe the park nearest to your home. Are there trees, a playground, or people walking their dogs?",
    proficiency: 2,
  },
  {
    title: "My Wardrobe",
    description:
      "Tell me about the clothes you wear in the winter. Do you wear a heavy coat, a scarf, and boots?",
    proficiency: 2,
  },
  {
    title: "Going to the Cinema",
    description:
      "How often do you go to see a movie? Tell me who you go with and if you like to eat popcorn.",
    proficiency: 2,
  },
  {
    title: "A Birthday Party",
    description:
      "Describe a typical birthday celebration in your house. Is there a cake, some candles, and a song?",
    proficiency: 2,
  },
  {
    title: "My Workplace",
    description:
      "Describe the building or room where you work or study. Is it bright, are there many desks, and do you have a window?",
    proficiency: 2,
  },
  {
    title: "Cooking a Simple Meal",
    description:
      "Tell me how to make a sandwich or a salad. What ingredients do you need and what do you do first?",
    proficiency: 2,
  },
  {
    title: "The Grocery Store",
    description:
      "What do you buy every week at the store? Tell me about the fruit, bread, or milk you put in your cart.",
    proficiency: 2,
  },
  {
    title: "A Phone Call",
    description:
      "Who was the last person you called? Tell me what you talked about and how long the call lasted.",
    proficiency: 2,
  },
  {
    title: "Getting Ready for Bed",
    description:
      "What do you do before you go to sleep? Tell me about brushing your teeth and setting your alarm.",
    proficiency: 2,
  },
  {
    title: "My Neighborhood",
    description:
      "Tell me about the street where you live. Is it noisy or quiet, and are there shops nearby?",
    proficiency: 2,
  },
  {
    title: "A Short Trip",
    description:
      "Tell me about a time you went to another city for one day. How did you get there and what did you see?",
    proficiency: 2,
  },
  {
    title: "My Hobbies",
    description:
      "What do you like to do in your free time? Tell me how often you do it and if it is expensive.",
    proficiency: 2,
  },
  {
    title: "Cleaning My Room",
    description:
      "How do you tidy up your space? Tell me where you put your books and how you make your bed.",
    proficiency: 2,
  },
  {
    title: "A Good Teacher",
    description:
      "Describe a teacher you liked. What subject did they teach and why were they helpful to you?",
    proficiency: 2,
  },
  {
    title: "Exercise Routine",
    description:
      "Do you go for a run or go to the gym? Tell me when you go and what kind of exercise you do.",
    proficiency: 2,
  },
  {
    title: "My Favorite Holiday",
    description:
      "Tell me about a holiday you love. What do people eat, what do they wear, and why is it a special day?",
    proficiency: 3,
  },
  {
    title: "A Typical School Day",
    description:
      "Describe your day when you were a student. What time did classes start and what was your favorite subject?",
    proficiency: 3,
  },
  {
    title: "Learning a New Skill",
    description:
      "Tell me about something you are trying to learn right now. Is it difficult and who is helping you?",
    proficiency: 3,
  },
  {
    title: "A Beautiful Beach",
    description:
      "Imagine you are at the beach. Describe the sand, the water, and what you like to do under the sun.",
    proficiency: 3,
  },
  {
    title: "My Best Friend",
    description:
      "How did you meet your best friend? Tell me what they are like and what activities you do together.",
    proficiency: 3,
  },
  {
    title: "A Restaurant Review",
    description:
      "Talk about a restaurant you visited recently. What did you order and was the service good or slow?",
    proficiency: 3,
  },
  {
    title: "Public Transportation",
    description:
      "How do people travel in your city? Tell me about the trains or buses and if they are usually on time.",
    proficiency: 3,
  },
  {
    title: "My Dream House",
    description:
      "If you could live anywhere, what would your house look like? Tell me how many rooms it has and if there is a garden.",
    proficiency: 3,
  },
  {
    title: "A Healthy Snack",
    description:
      "What is something healthy you like to eat? Tell me how you prepare it and why it is good for you.",
    proficiency: 3,
  },
  {
    title: "Using Social Media",
    description:
      "Which apps do you use to talk to friends? Tell me how much time you spend on them every day.",
    proficiency: 3,
  },
  {
    title: "A Great Movie",
    description:
      "Tell me about a movie you saw recently. Who were the main characters and was it a happy or sad story?",
    proficiency: 3,
  },
  {
    title: "My Hometown",
    description:
      "Where were you born? Describe the town and tell me one thing that is famous or special about it.",
    proficiency: 3,
  },
  {
    title: "Working in an Office",
    description:
      "What is it like to work in an office? Describe your desk, your colleagues, and the coffee machine.",
    proficiency: 3,
  },
  {
    title: "A Busy Street",
    description:
      "Describe a street in the center of your city. Mention the traffic, the people walking, and the tall buildings.",
    proficiency: 3,
  },
  {
    title: "Weather in My Country",
    description:
      "How is the weather during the summer and winter? Tell me which season you prefer and why.",
    proficiency: 3,
  },
  {
    title: "A Fun Weekend",
    description:
      "What did you do last weekend? Tell me where you went, who you were with, and if you had a good time.",
    proficiency: 3,
  },
  {
    title: "My Daily Breakfast",
    description:
      "What do you usually eat when you wake up? Tell me if you make it yourself and what you like to drink with it.",
    proficiency: 3,
  },
  {
    title: "Shopping for Clothes",
    description:
      "Do you like buying new clothes? Tell me what you look for in a store and if you prefer shopping alone.",
    proficiency: 3,
  },
  {
    title: "A Beautiful Garden",
    description:
      "Describe a garden you know. What flowers are there and is it a quiet place to sit and relax?",
    proficiency: 3,
  },
  {
    title: "Watching Sports",
    description:
      "Do you like watching football, cricket, or tennis? Tell me which team you like and why they are good.",
    proficiency: 3,
  },
  {
    title: "A Useful App",
    description:
      "Tell me about an app on your phone that helps you every day. What does it do and why is it easy to use?",
    proficiency: 3,
  },
  {
    title: "My Favorite Season",
    description:
      "Which time of year do you like most? Tell me about the temperature and what clothes you wear during that time.",
    proficiency: 3,
  },
  {
    title: "A Library Visit",
    description:
      "Have you ever been to a big library? Describe the rows of books and the people studying quietly.",
    proficiency: 3,
  },
  {
    title: "My Pet's Routine",
    description:
      "If you have a pet, tell me what it does all day. When does it eat and where does it like to sleep?",
    proficiency: 3,
  },
  {
    title: "Planning a Party",
    description:
      "Imagine you are having a party next week. Who will you invite and what food will you buy for your guests?",
    proficiency: 3,
  },
  {
    title: "A Memorable Meal",
    description:
      "Think of a dinner that was really special. Where were you, who cooked it, and why did it taste so good?",
    proficiency: 4,
  },
  {
    title: "Your First Job",
    description:
      "Try to remember your very first job or internship. What were your tasks and how did you feel on your first day?",
    proficiency: 4,
  },
  {
    title: "A Place I Want to Visit",
    description:
      "Is there a country you've always dreamed of seeing? Tell me why you want to go there and what you'd do first.",
    proficiency: 4,
  },
  {
    title: "Technology in the Home",
    description:
      "How has technology changed your house in the last few years? Tell me about a gadget you couldn't live without now.",
    proficiency: 4,
  },
  {
    title: "An Important Tradition",
    description:
      "Describe a tradition your family follows. Do you think it's important to keep these customs alive today?",
    proficiency: 4,
  },
  {
    title: "The Best Way to Travel",
    description:
      "Do you prefer trains, planes, or cars for long trips? Compare them and explain which one is more comfortable for you.",
    proficiency: 4,
  },
  {
    title: "A Childhood Hobby",
    description:
      "What did you love doing when you were ten years old? Tell me if you still do it now or why you stopped.",
    proficiency: 4,
  },
  {
    title: "Healthy Living",
    description:
      "Is it easy to stay healthy in your city? Talk about the challenges of eating well and finding time for exercise.",
    proficiency: 4,
  },
  {
    title: "A Great Book",
    description:
      "Tell me about a book that made a big impression on you. What was the story about and would you recommend it?",
    proficiency: 4,
  },
  {
    title: "Learning Languages",
    description:
      "Why did you decide to learn your target language? Share your goals and what you find most difficult so far.",
    proficiency: 4,
  },
  {
    title: "Changes in My City",
    description:
      "How has your neighborhood changed since you were a child? Talk about new buildings or shops that have appeared.",
    proficiency: 4,
  },
  {
    title: "The Importance of Music",
    description:
      "What kind of music do you listen to when you are stressed? Explain how music changes your mood or helps you work.",
    proficiency: 4,
  },
  {
    title: "A Future Goal",
    description:
      "Where do you see yourself in five years? Talk about a professional or personal milestone you hope to reach.",
    proficiency: 4,
  },
  {
    title: "An Unforgettable Trip",
    description:
      "Tell me about a vacation that didn't go as planned. What went wrong and how did you handle the situation?",
    proficiency: 4,
  },
  {
    title: "Shopping Online vs In-Store",
    description:
      "Which do you prefer and why? Compare the convenience of online shopping with the experience of visiting a real shop.",
    proficiency: 4,
  },
  {
    title: "My Favorite Childhood Food",
    description:
      "What did you love eating as a kid? Describe the taste and tell me if you can still find it today.",
    proficiency: 4,
  },
  {
    title: "The Perfect Weekend",
    description:
      "Describe your ideal Saturday and Sunday. Where would you go and who would you spend your time with?",
    proficiency: 4,
  },
  {
    title: "A Skill I'd Like to Learn",
    description:
      "If you had more free time, what new hobby would you start? Explain why this skill interests you.",
    proficiency: 4,
  },
  {
    title: "Nature vs City Life",
    description:
      "Do you prefer living in a busy city or a quiet village? Discuss the pros and cons of both lifestyles.",
    proficiency: 4,
  },
  {
    title: "An Inspiring Person",
    description:
      "Who is someone you admire? It could be a celebrity or a friend—just explain what makes them special.",
    proficiency: 4,
  },
  {
    title: "Saving Money",
    description:
      "Is it hard for you to save money? Tell me about something you are currently saving for and how you manage your budget.",
    proficiency: 4,
  },
  {
    title: "The Best Age to Be",
    description:
      "In your opinion, what is the best age in life? Explain why you think being that age is better than being a child or a senior.",
    proficiency: 4,
  },
  {
    title: "A Local Festival",
    description:
      "Describe a festival that happens in your area. What do people do and what is your favorite part of the celebration?",
    proficiency: 4,
  },
  {
    title: "My School Memories",
    description:
      "Was your school experience positive? Tell me about a subject you hated and one you loved.",
    proficiency: 4,
  },
  {
    title: "Working from Home",
    description:
      "Do you think working from home is better than going to an office? Share your thoughts on how it affects your day.",
    proficiency: 4,
  },
  {
    title: "The Role of Tourism",
    description:
      "How does tourism affect your country? Talk about whether you think it's mostly good for the economy or bad for the environment.",
    proficiency: 5,
  },
  {
    title: "A Major Life Decision",
    description:
      "Think of a time you had to make a big choice. What were the options and how did you finally decide what to do?",
    proficiency: 5,
  },
  {
    title: "The Impact of Social Media",
    description:
      "Is social media making us more or less lonely? Give your opinion and talk about how you use these platforms yourself.",
    proficiency: 5,
  },
  {
    title: "Environmental Protection",
    description:
      "What can individuals do to help the planet? Suggest three small changes people can make in their daily lives.",
    proficiency: 5,
  },
  {
    title: "The Perfect Boss",
    description:
      "Describe the qualities of a great leader at work. Do you think it's more important to be kind or to be efficient?",
    proficiency: 5,
  },
  {
    title: "Tradition vs Modernity",
    description:
      "Are young people losing touch with their culture? Discuss how modern life is changing traditional values in your country.",
    proficiency: 5,
  },
  {
    title: "A Scary Experience",
    description:
      "Tell me about a time you felt truly frightened. What happened and how did you feel after the danger passed?",
    proficiency: 5,
  },
  {
    title: "The Future of Transportation",
    description:
      "How will we get around in fifty years? Talk about electric cars, flying drones, or other ideas you have.",
    proficiency: 5,
  },
  {
    title: "The Cost of Living",
    description:
      "Is it getting too expensive to live in big cities? Discuss how rising prices are affecting people's goals and dreams.",
    proficiency: 5,
  },
  {
    title: "Education for Everyone",
    description:
      "Should university education be free? Argue your point and consider how it would change society if everyone could go.",
    proficiency: 5,
  },
  {
    title: "A Hobby That Became a Passion",
    description:
      "Has a simple interest ever turned into a big part of your life? Tell the story of how that happened.",
    proficiency: 5,
  },
  {
    title: "The Influence of Advertising",
    description:
      "Do ads really make us buy things we don't need? Talk about a time you bought something because of a clever commercial.",
    proficiency: 5,
  },
  {
    title: "Living Abroad",
    description:
      "If you moved to a new country tomorrow, what would you miss most? Talk about the challenges of adapting to a new culture.",
    proficiency: 5,
  },
  {
    title: "Fast Food vs Home Cooking",
    description:
      "Why is fast food so popular despite being unhealthy? Compare it to the benefits of preparing your own meals.",
    proficiency: 5,
  },
  {
    title: "A Success Story",
    description:
      "Tell me about a time you worked hard and achieved a goal. What steps did you take and who helped you succeed?",
    proficiency: 5,
  },
  {
    title: "The Power of Friendship",
    description:
      "What makes a long-term friendship last? Talk about the qualities you value most in your closest friends.",
    proficiency: 5,
  },
  {
    title: "Automation in the Workplace",
    description:
      "Are you worried about robots taking over jobs? Discuss which professions are safe and which might disappear.",
    proficiency: 5,
  },
  {
    title: "A Change in Perspective",
    description:
      "Describe a time you changed your mind about an important issue. What made you see things differently?",
    proficiency: 5,
  },
  {
    title: "The Importance of Art",
    description:
      "Why do humans create art? Discuss whether art should be taught in all schools or if it's just a luxury.",
    proficiency: 5,
  },
  {
    title: "Privacy Online",
    description:
      "Do you feel safe sharing your information on the internet? Talk about the risks of the digital world today.",
    proficiency: 5,
  },
  {
    title: "A Beautiful National Park",
    description:
      "Describe a place of natural beauty you have visited. Why is it important to protect these areas from development?",
    proficiency: 5,
  },
  {
    title: "Balancing Work and Life",
    description:
      "How do you make sure you don't work too much? Share your tips for maintaining a healthy balance in a busy world.",
    proficiency: 5,
  },
  {
    title: "The Future of Reading",
    description:
      "Will physical books disappear because of e-readers? Compare the feeling of a paper book with a digital screen.",
    proficiency: 5,
  },
  {
    title: "A Famous Historical Event",
    description:
      "Pick an event from your country's history and explain its significance. Why is it still remembered today?",
    proficiency: 5,
  },
  {
    title: "Overcoming a Fear",
    description:
      "Was there something you were once afraid of but now enjoy? Tell me the story of how you conquered that fear.",
    proficiency: 5,
  },
  {
    title: "The Universal Language",
    description:
      "Music is often called a universal language. Do you agree? Debate whether music can really bridge cultural gaps without words.",
    proficiency: 6,
  },
  {
    title: "A Turning Point",
    description:
      "Tell a story about a specific moment that changed the direction of your life. How did you feel before and after?",
    proficiency: 6,
  },
  {
    title: "The Ethics of AI",
    description:
      "As AI becomes more human-like, what moral questions should we be asking? Discuss the potential benefits and dangers.",
    proficiency: 6,
  },
  {
    title: "Urban Development",
    description:
      "Should we build more skyscrapers or preserve historic buildings? Debate which is better for a growing city's identity.",
    proficiency: 6,
  },
  {
    title: "The Meaning of Success",
    description:
      "Is success about money, happiness, or helping others? Define your personal philosophy and how it has evolved over time.",
    proficiency: 6,
  },
  {
    title: "A Lesson from Failure",
    description:
      "Narrate a time you failed at something. Instead of focusing on the loss, explain the valuable lesson you gained from it.",
    proficiency: 6,
  },
  {
    title: "Climate Change Responsibility",
    description:
      "Who is more responsible for fixing the climate: governments or corporations? Argue your stance with specific reasons.",
    proficiency: 6,
  },
  {
    title: "The Value of Higher Education",
    description:
      "Is a degree still necessary for a good career? Compare the traditional university path with vocational training or self-teaching.",
    proficiency: 6,
  },
  {
    title: "A Cultural Misunderstanding",
    description:
      "Tell a story about a time you misunderstood someone from a different culture. How did you resolve the situation?",
    proficiency: 6,
  },
  {
    title: "Space Exploration",
    description:
      "Should we spend billions on Mars missions when there are problems on Earth? Defend one side of this common debate.",
    proficiency: 6,
  },
  {
    title: "The Influence of Celebrity",
    description:
      "Do celebrities have a responsibility to be good role models? Discuss how their public actions affect younger generations.",
    proficiency: 6,
  },
  {
    title: "Remote Work and Society",
    description:
      "If everyone works from home, what happens to the 'soul' of the city? Explore the social impact of empty office districts.",
    proficiency: 6,
  },
  {
    title: "The Concept of Home",
    description:
      "Is 'home' a physical place or a feeling? Elaborate on what factors make you feel truly at home somewhere.",
    proficiency: 6,
  },
  {
    title: "Genetic Engineering",
    description:
      "Should we be allowed to edit human DNA to prevent diseases? Discuss the potential slippery slope of 'designer babies.'",
    proficiency: 6,
  },
  {
    title: "A Random Act of Kindness",
    description:
      "Tell a story about a time a stranger helped you or you helped them. How did that small interaction change your day?",
    proficiency: 6,
  },
  {
    title: "The News Cycle",
    description:
      "Does the 24-hour news cycle do more harm than good? Debate whether constant information makes us more aware or more anxious.",
    proficiency: 6,
  },
  {
    title: "Animal Rights in Science",
    description:
      "Is animal testing ever justifiable for medical breakthroughs? Explore the ethical conflict between human health and animal welfare.",
    proficiency: 6,
  },
  {
    title: "The Death of Privacy",
    description:
      "With cameras and data tracking everywhere, is privacy a thing of the past? Discuss if we should just accept this new reality.",
    proficiency: 6,
  },
  {
    title: "Impact of a Great Mentor",
    description:
      "Talk about someone who guided your career or life. Explain the specific advice they gave and how it shaped your path.",
    proficiency: 6,
  },
  {
    title: "Globalism vs Localism",
    description:
      "Is it better to buy local products or enjoy the variety of a global market? Debate the economic and environmental impacts.",
    proficiency: 6,
  },
  {
    title: "Public Art and Graffiti",
    description:
      "When does street art become vandalism? Discuss the role of public art in expressing a city's culture and frustrations.",
    proficiency: 6,
  },
  {
    title: "The Future of Language",
    description:
      "Will English eventually replace all other languages? Discuss the importance of linguistic diversity and cultural identity.",
    proficiency: 6,
  },
  {
    title: "Mental Health Awareness",
    description:
      "Why was mental health a taboo topic for so long? Discuss how society's view of psychological well-being is shifting.",
    proficiency: 6,
  },
  {
    title: "The Ethics of Wealth",
    description:
      "Should there be a limit on how much money one person can own? Debate the idea of a 'maximum wage' or extreme wealth taxes.",
    proficiency: 6,
  },
  {
    title: "A Life Without the Internet",
    description:
      "Hypothetically, how would our society function if the internet shut down forever tomorrow? Describe the immediate and long-term changes.",
    proficiency: 6,
  },
  {
    title: "Censorship in Art",
    description:
      "Should the government have the right to ban offensive art or books? Argue for the balance between free speech and social harmony.",
    proficiency: 7,
  },
  {
    title: "The Paradox of Choice",
    description:
      "Does having more options actually make us less happy? Discuss this idea in the context of modern dating, shopping, or careers.",
    proficiency: 7,
  },
  {
    title: "A Tale of Two Cities",
    description:
      "Compare two cities you know well. Analyze how their history, architecture, and people create two completely different 'vibes.'",
    proficiency: 7,
  },
  {
    title: "Universal Basic Income",
    description:
      "Would giving everyone a set amount of money every month solve poverty or kill motivation? Defend your position on UBI.",
    proficiency: 7,
  },
  {
    title: "The Reliability of Memory",
    description:
      "Can we trust our own memories of childhood? Reflect on how stories we are told might replace our actual experiences.",
    proficiency: 7,
  },
  {
    title: "Artificial Intelligence in Art",
    description:
      "Can a machine ever truly be 'creative'? Debate whether AI-generated paintings and music should be considered real art.",
    proficiency: 7,
  },
  {
    title: "The Sustainability Myth",
    description:
      "Is 'green' consumerism just a marketing trick? Critique the idea that we can shop our way out of a climate crisis.",
    proficiency: 7,
  },
  {
    title: "The Evolution of Family",
    description:
      "How has the definition of 'family' changed in the last century? Discuss the shift from nuclear families to more diverse structures.",
    proficiency: 7,
  },
  {
    title: "A Moral Dilemma",
    description:
      "Present a difficult 'what would you do' scenario. Walk me through the conflicting ethics and explain your final choice.",
    proficiency: 7,
  },
  {
    title: "The Future of Democracy",
    description:
      "In an age of misinformation, can democracy survive? Discuss the threats posed by social media algorithms to political systems.",
    proficiency: 7,
  },
  {
    title: "The Cultural Significance of Food",
    description:
      "Is food the strongest link we have to our ancestors? Reflect on how specific dishes preserve a culture's history and identity.",
    proficiency: 7,
  },
  {
    title: "Work-Life Integration",
    description:
      "Is the '9-to-5' model dead? Argue for or against a more flexible approach where work and life are fully integrated.",
    proficiency: 7,
  },
  {
    title: "The Philosophy of Time",
    description:
      "Why does time seem to speed up as we get older? Discuss the psychological perception of time and how to 'slow it down.'",
    proficiency: 7,
  },
  {
    title: "The Ethics of Space Tourism",
    description:
      "Should the ultra-rich be allowed to go to space for fun while the Earth suffers? Debate the environmental and moral costs.",
    proficiency: 7,
  },
  {
    title: "A Story of Redemption",
    description:
      "Tell a structured story about someone who made a terrible mistake but worked hard to fix it. What did they learn?",
    proficiency: 7,
  },
  {
    title: "The Power of Nostalgia",
    description:
      "Why do we always think the past was better than the present? Analyze how nostalgia influences entertainment and politics.",
    proficiency: 7,
  },
  {
    title: "Mandatory Community Service",
    description:
      "Should all young people be required to serve their country for a year? Debate the pros and cons of national service.",
    proficiency: 7,
  },
  {
    title: "The Digital Divide",
    description:
      "How does lack of internet access reinforce global inequality? Propose solutions for bridging the gap between tech-rich and tech-poor.",
    proficiency: 7,
  },
  {
    title: "The End of Traditional Media",
    description:
      "Will newspapers and cable TV exist in 20 years? Discuss the consequences of getting all our news from influencers and YouTubers.",
    proficiency: 7,
  },
  {
    title: "Overpopulation vs Underpopulation",
    description:
      "Which is the bigger threat to our future: too many people or a shrinking, aging population? Defend your view.",
    proficiency: 7,
  },
  {
    title: "The Role of Luck in Success",
    description:
      "Is hard work really the key to success, or is it mostly luck? Analyze the balance between effort and circumstance.",
    proficiency: 7,
  },
  {
    title: "The Ethics of Fast Fashion",
    description:
      "Can we justify buying cheap clothes when we know the human and environmental cost? Debate the responsibility of the consumer.",
    proficiency: 7,
  },
  {
    title: "The Psychology of Fear",
    description:
      "Why do some people enjoy horror movies and extreme sports? Explore the link between fear, adrenaline, and pleasure.",
    proficiency: 7,
  },
  {
    title: "Preserving Endangered Languages",
    description:
      "Why does it matter if a language with only 100 speakers dies out? Argue for the importance of linguistic diversity.",
    proficiency: 7,
  },
  {
    title: "The Concept of Justice",
    description:
      "Is the legal system actually just? Discuss the difference between following the law and doing what is right.",
    proficiency: 7,
  },
  {
    title: "The Meritocracy Trap",
    description:
      "Does a system that rewards talent actually create more inequality? Critique the idea that anyone can succeed if they just try hard enough.",
    proficiency: 8,
  },
  {
    title: "Post-Humanism",
    description:
      "If we could upload our consciousness to a computer, would we still be 'human'? Explore the philosophical boundaries of personhood.",
    proficiency: 8,
  },
  {
    title: "The Burden of History",
    description:
      "Should current generations apologize or pay for the crimes of their ancestors? Debate the ethics of historical reparations.",
    proficiency: 8,
  },
  {
    title: "The Death of Expertise",
    description:
      "Why do people trust 'influencers' over scientists and doctors today? Analyze the breakdown of trust in traditional institutions.",
    proficiency: 8,
  },
  {
    title: "Subjective vs Objective Reality",
    description:
      "Is there a single truth, or is everything just a matter of perspective? Discuss how our biases shape the world we see.",
    proficiency: 8,
  },
  {
    title: "The Ethics of Life Extension",
    description:
      "If we could live to 200, should we? Discuss the social, economic, and personal implications of a drastically longer lifespan.",
    proficiency: 8,
  },
  {
    title: "Globalization and Homogeneity",
    description:
      "Is the world becoming a boring, identical place? Critique how global brands are erasing unique local cultures and flavors.",
    proficiency: 8,
  },
  {
    title: "The Illusion of Free Will",
    description:
      "If our brains are just biological machines, do we really make our own choices? Explore the tension between science and agency.",
    proficiency: 8,
  },
  {
    title: "The Future of Sovereignty",
    description:
      "Will nation-states eventually be replaced by global corporations or city-states? Predict the future of political borders.",
    proficiency: 8,
  },
  {
    title: "The Moral Status of Animals",
    description:
      "Do animals have 'rights' in the same way humans do? Argue for or against a legal shift in how we treat non-human species.",
    proficiency: 8,
  },
  {
    title: "Hyper-Connectivity and Solitude",
    description:
      "In an age of instant messaging, have we lost the ability to be alone? Discuss the importance of solitude for the human spirit.",
    proficiency: 8,
  },
  {
    title: "The Aesthetics of Decay",
    description:
      "Why do we find beauty in ruins and old buildings? Reflect on the human fascination with time, impermanence, and 'memento mori.'",
    proficiency: 8,
  },
  {
    title: "Technological Singularity",
    description:
      "What happens when AI becomes smarter than all of humanity combined? Describe the potential utopia or dystopia that follows.",
    proficiency: 8,
  },
  {
    title: "The Ethics of Surveillance Capitalism",
    description:
      "Is it okay for companies to profit from our personal data? Analyze the trade-off between free services and total transparency.",
    proficiency: 8,
  },
  {
    title: "The Role of Myth in Modernity",
    description:
      "Do we still need myths and legends, or has science replaced them? Discuss how modern stories like superheroes serve ancient needs.",
    proficiency: 8,
  },
  {
    title: "The Limits of Free Speech",
    description:
      "Should 'hate speech' be legally protected to ensure total freedom of expression? Debate where the line should be drawn.",
    proficiency: 8,
  },
  {
    title: "The Social Contract",
    description:
      "What do we owe society, and what does society owe us? Critique the current balance of taxes, safety, and individual liberty.",
    proficiency: 8,
  },
  {
    title: "Algorithmic Bias",
    description:
      "Can a computer program be racist or sexist? Explore how human prejudices are baked into the software that runs our lives.",
    proficiency: 8,
  },
  {
    title: "The Value of Suffering",
    description:
      "Is a life without pain actually a good life? Discuss whether struggle and hardship are necessary for personal growth and character.",
    proficiency: 8,
  },
  {
    title: "Cultural Appropriation",
    description:
      "Where is the line between admiring a culture and stealing from it? Debate the ethics of using elements from other traditions.",
    proficiency: 8,
  },
  {
    title: "The End of Work",
    description:
      "If robots do everything, what will humans do with their time? Explore the psychological challenge of a society without 'jobs.'",
    proficiency: 8,
  },
  {
    title: "The Tyranny of the Majority",
    description:
      "In a democracy, how do we protect the rights of the few from the whims of the many? Discuss the dangers of populism.",
    proficiency: 8,
  },
  {
    title: "Environmental Ethics",
    description:
      "Does nature have intrinsic value regardless of its use to humans? Argue for a philosophy that puts the Earth first.",
    proficiency: 8,
  },
  {
    title: "The Psychology of Power",
    description:
      "Does power always corrupt, or does it just reveal who someone truly is? Analyze the behavior of leaders throughout history.",
    proficiency: 8,
  },
  {
    title: "The Purpose of Art in Crisis",
    description:
      "In times of war or famine, is art a waste of resources? Defend the role of creativity during humanity's darkest hours.",
    proficiency: 8,
  },
  {
    title: "The Architecture of Happiness",
    description:
      "How does the design of our cities and buildings affect our mental health? Propose a new way of building for human well-being.",
    proficiency: 9,
  },
  {
    title: "The Commodification of Self",
    description:
      "Are we all just 'brands' now? Critique the pressure to market our personalities and private lives on social media.",
    proficiency: 9,
  },
  {
    title: "Existential Risks",
    description:
      "Which is most likely to end humanity: climate change, AI, or nuclear war? Evaluate the threats and our lack of preparation.",
    proficiency: 9,
  },
  {
    title: "The Ethics of Gene Drive",
    description:
      "Should we intentionally wipe out mosquitoes to end malaria, even if it disrupts the ecosystem? Debate the 'God complex' in science.",
    proficiency: 9,
  },
  {
    title: "The Death of the Author",
    description:
      "Can we separate an artist's work from their personal crimes? Argue whether 'canceling' art is a valid moral response.",
    proficiency: 9,
  },
  {
    title: "The Philosophy of Language",
    description:
      "Does the language we speak limit the thoughts we are able to have? Explore the Sapir-Whorf hypothesis in depth.",
    proficiency: 9,
  },
  {
    title: "Neuroethics",
    description:
      "If we could use pills to make ourselves more empathetic or brave, should we? Discuss the ethical implications of 'moral bioenhancement.'",
    proficiency: 9,
  },
  {
    title: "The Fragility of Civilization",
    description:
      "How close is modern society to a total collapse? Analyze the systems we rely on and how easily they could be broken.",
    proficiency: 9,
  },
  {
    title: "The Myth of Progress",
    description:
      "Is humanity actually getting 'better,' or are we just getting more technologically advanced? Critique the idea of moral evolution.",
    proficiency: 9,
  },
  {
    title: "Post-Truth Politics",
    description:
      "When facts no longer matter to the public, how can we govern? Discuss the rise of 'alternative facts' and the death of shared reality.",
    proficiency: 9,
  },
  {
    title: "The Ethics of Deepfakes",
    description:
      "In a world where video evidence can be faked, what happens to the concept of truth? Explore the legal and social fallout.",
    proficiency: 9,
  },
  {
    title: "The Future of Human Rights",
    description:
      "Are 'human rights' a universal truth or just a Western invention? Debate whether they can be applied to all cultures equally.",
    proficiency: 9,
  },
  {
    title: "The Colonization of Mars",
    description:
      "Should we bring our laws and capitalism to other planets? Propose a new social structure for the first Martian colony.",
    proficiency: 9,
  },
  {
    title: "The Loneliness Epidemic",
    description:
      "Why is the most 'connected' generation the loneliest? Analyze the systemic causes of isolation in the 21st century.",
    proficiency: 9,
  },
  {
    title: "The Ethics of Memory Erasure",
    description:
      "If we could delete traumatic memories, would we lose a part of our identity? Debate the psychological cost of avoiding pain.",
    proficiency: 9,
  },
  {
    title: "The Paradox of Tolerance",
    description:
      "Must a tolerant society tolerate intolerance? Explore the limits of acceptance in a pluralistic world.",
    proficiency: 9,
  },
  {
    title: "Artificial General Intelligence",
    description:
      "Will an AGI have a soul? Discuss the criteria for consciousness and whether we owe 'human rights' to machines.",
    proficiency: 9,
  },
  {
    title: "The End of Privacy in the Brain",
    description:
      "What happens when tech can read our thoughts? Discuss the final frontier of privacy: our internal monologue.",
    proficiency: 9,
  },
  {
    title: "Intergenerational Justice",
    description:
      "Do we have a moral obligation to people who haven't been born yet? Critique our current consumption of planet resources.",
    proficiency: 9,
  },
  {
    title: "The Philosophy of Science",
    description:
      "Is science just another belief system, or is it fundamentally different? Debate the objectivity of the scientific method.",
    proficiency: 9,
  },
  {
    title: "The Ethics of Radical Life Extension",
    description:
      "If only the rich can afford to live forever, what happens to the 'human' race? Explore the potential for a biological class divide.",
    proficiency: 9,
  },
  {
    title: "The Value of Boredom",
    description:
      "In an age of constant stimulation, have we lost the creative power of being bored? Argue for the necessity of 'nothingness.'",
    proficiency: 9,
  },
  {
    title: "Decolonizing the Mind",
    description:
      "How does history's legacy of empire still shape our education and self-image? Discuss the process of unlearning systemic biases.",
    proficiency: 9,
  },
  {
    title: "The Future of Intimacy",
    description:
      "Will AI partners eventually replace human relationships? Analyze the shifting nature of love and companionship in a digital age.",
    proficiency: 9,
  },
  {
    title: "The Limits of Human Knowledge",
    description:
      "Are there things about the universe that our brains are simply not evolved to understand? Reflect on the 'unknown unknowns.'",
    proficiency: 9,
  },
  {
    title: "The Ontological Status of Digital Objects",
    description:
      "Is a digital artifact as 'real' as a physical one? Defend the reality of the virtual world against traditional materialism.",
    proficiency: 10,
  },
  {
    title: "The Transhumanist Dilemma",
    description:
      "At what point in our cybernetic enhancement do we cease to be the same person? Solve the Ship of Theseus as applied to the self.",
    proficiency: 10,
  },
  {
    title: "The Moral Philosophy of Non-Existence",
    description:
      "Is it ethical to bring a child into a world destined for suffering? Construct a nuanced argument regarding antinatalism.",
    proficiency: 10,
  },
  {
    title: "The Semiotics of Power",
    description:
      "How do those in power use language to define reality itself? Analyze the relationship between vocabulary and political control.",
    proficiency: 10,
  },
  {
    title: "The Epistemological Crisis",
    description:
      "In a world of infinite data, how can we differentiate between knowledge and noise? Propose a new framework for modern truth.",
    proficiency: 10,
  },
  {
    title: "The Aesthetics of the Sublime",
    description:
      "Why are we drawn to things that are terrifyingly vast or beautiful? Explore the intersection of awe, terror, and the human ego.",
    proficiency: 10,
  },
  {
    title: "The Ethics of Future Narratives",
    description:
      "Does our obsession with dystopia make a bad future more likely? Critique the cultural impact of our collective storytelling.",
    proficiency: 10,
  },
  {
    title: "The Global Commons",
    description:
      "How do we govern resources like the deep ocean or the atmosphere that belong to no one? Design a post-national legal framework.",
    proficiency: 10,
  },
  {
    title: "The Phenomenology of Time",
    description:
      "If our experience of time is a construction, what is the 'now'? Reflect on the nature of consciousness without the past or future.",
    proficiency: 10,
  },
  {
    title: "The Deconstruction of Identity",
    description:
      "Is 'the self' just a useful fiction created by language? Argue for a model of identity that accounts for neurological fluidity.",
    proficiency: 10,
  },
  {
    title: "The Ethics of Information",
    description:
      "Should some knowledge be kept secret for the safety of the species? Debate the dangers of 'open source' high-risk science.",
    proficiency: 10,
  },
  {
    title: "The Architecture of Control",
    description:
      "How do our modern 'smart cities' function as invisible prisons? Critique the intersection of urban design and surveillance.",
    proficiency: 10,
  },
  {
    title: "The Metaphysics of Art",
    description:
      "Does art exist if there is no observer to witness it? Explore the dependency of meaning on consciousness.",
    proficiency: 10,
  },
  {
    title: "The Limits of Utilitarianism",
    description:
      "Is it right to sacrifice the few for the many if the 'many' is a machine? Challenge the math of traditional ethics.",
    proficiency: 10,
  },
  {
    title: "The Post-Colonial Body",
    description:
      "How is the history of conquest written on the physical bodies and health of modern people? Analyze the biology of trauma.",
    proficiency: 10,
  },
  {
    title: "The Silence of the Universe",
    description:
      "What does the Fermi Paradox tell us about our own survival? Interpret the 'great silence' of space as a warning to humanity.",
    proficiency: 10,
  },
  {
    title: "The Ethics of Algorithmic Governance",
    description:
      "Should we let a perfectly neutral AI run our legal system? Debate the loss of human mercy in exchange for perfect consistency.",
    proficiency: 10,
  },
  {
    title: "The Philosophy of Absence",
    description:
      "How does what is 'missing' from a culture define it more than what is present? Analyze the power of cultural voids.",
    proficiency: 10,
  },
  {
    title: "The Future of Causality",
    description:
      "In a world of predictive analytics, are we still responsible for our actions? Discuss the death of the 'accident.'",
    proficiency: 10,
  },
  {
    title: "The Commodification of Dissent",
    description:
      "How does capitalism turn rebellion into a product? Critique the 'industrial complex' of social justice and counter-culture.",
    proficiency: 10,
  },
  {
    title: "The Ontological Security of the State",
    description:
      "Why do nations prioritize their own survival over the lives of their citizens? Deconstruct the 'myth' of the immortal state.",
    proficiency: 10,
  },
  {
    title: "The Ethics of Biological Re-wilding",
    description:
      "Should we bring back extinct species to repair ecosystems we broke? Analyze the unintended consequences of playing God.",
    proficiency: 10,
  },
  {
    title: "The Transcendental Aesthetic",
    description:
      "Can math be beautiful, or is beauty purely a sensory experience? Debate the existence of objective aesthetic truths.",
    proficiency: 10,
  },
  {
    title: "The End of Anthropocentrism",
    description:
      "What would a world look like where humans are no longer the most important thing? Construct a non-human-centered philosophy.",
    proficiency: 10,
  },
  {
    title: "The Finality of Choice",
    description:
      "In a multiverse, does any individual decision actually matter? Reconcile quantum theory with the weight of moral agency.",
    proficiency: 10,
  },
];
