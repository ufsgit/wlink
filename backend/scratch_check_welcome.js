require('./src/db/pool').query('SELECT * FROM chatbots').then(res => {
  const bots = res[0];
  const welcomeBot = bots.find(b =>
    (b.name.toLowerCase().includes('welcome') || b.name.toLowerCase().includes('main menu')) ||
    (b.ai_enabled && (!b.trigger_keywords || b.trigger_keywords.length === 0 || b.trigger_keywords.includes('*')))
  );
  console.log("Welcome bot found:", welcomeBot ? welcomeBot.name : null);
  
  if (welcomeBot) {
    console.log("Trigger keywords length:", welcomeBot.trigger_keywords?.length);
    console.log("Type of trigger_keywords:", typeof welcomeBot.trigger_keywords);
    console.log("Is array?", Array.isArray(welcomeBot.trigger_keywords));
    console.log("Includes *?", welcomeBot.trigger_keywords?.includes('*'));
  }
}).catch(console.error).finally(()=>process.exit(0));
