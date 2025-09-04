module.exports = {
  config: {
    name: "welcome2",
    version: "2.1",
    author: "nafijninja",
    category: "events"
  },

  onStart: async ({ event, api }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const dataAddedParticipants = event.logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();
/*
    // If the bot was added, set nickname
    if (dataAddedParticipants.some(item => item.userFbId == botID)) {
      api.changeNickname("😾 angry sizukua🥺🌷", threadID, botID);
    }
  }
};
*/
