This repo is a fork from main repo and will usually have new features bundled faster than main repo (and maybe bundle some bugs, too).
See main repo [here](https://github.com/Schmavery/facebook-chat-api).

# Unofficial Facebook Chat API
 
This is the folder that is detached from [this project](https://github.com/ntkhang03/fb-chat-api)

## New Features Added:

### Message Features:
- `api.pinMessage(messageID, threadID, pin, callback)` - Pin/unpin messages
- `api.forwardMessage(messageID, threadIDs, callback)` - Forward messages to other chats
- `api.getMessageReactions(messageID, callback)` - Get message reactions
- `api.getMessageInfo(messageID, threadID, callback)` - Get detailed message information
- `api.reportMessage(messageID, reason, callback)` - Report message for violations
- `api.searchMessages(query, threadID, limit, callback)` - Search messages

### Group Management:
- `api.setApprovalMode(threadID, approvalMode, callback)` - Set group approval mode
- `api.acceptPendingRequest(threadID, accept, callback)` - Accept/reject pending requests
- `api.setThreadJoinability(threadID, joinable, callback)` - Enable/disable group join links
- `api.kickFromGroup(userIDs, threadID, callback)` - Kick users from group (alias for removeUserFromGroup)

### User Status:
- `api.getOnlineUsers(callback)` - Get list of online users
- `api.getActiveStatus(userID, callback)` - Get user's active status
- `api.setActiveStatus(active, callback)` - Set your active status
- `api.setTypingStatus(threadID, isTyping, callback)` - Set typing indicator

### Utility:
- `api.getPendingMessages(callback)` - Get pending message requests
- `api.createEvent(threadID, eventDetails, callback)` - Create group events

### Enhanced Features:
- Improved error handling with more detailed error information
- Enhanced message formatting with additional metadata
- Better support for different message types and attachments
- Improved presence tracking and online status detection

### Human Behavior System:
- `api.setHumanMode(enabled)` - Enable/disable human-like behavior
- `api.getHumanBehaviorStats()` - Get behavior statistics
- Advanced typing simulation with realistic patterns
- Natural reading delays and response timing
- Automatic session breaks and device switching
- Anti-detection headers and network simulation
- Smart rate limiting to prevent spam detection

### Additional Features:
- `api.getStickers(callback)` - Get available sticker packs
- `api.getConversations(limit, timestamp, callback)` - Get conversation list
- `api.getNotifications(callback)` - Get Facebook notifications
- `api.getPages(callback)` - Get managed pages
- `api.getGroups(limit, callback)` - Get joined groups
- `api.sendReaction(threadID, reaction, callback)` - Send reaction to latest message
- `api.getEvents(threadID, callback)` - Get group events
- `api.blockUser(userID, block, callback)` - Block/unblock users
- `api.getGameList(callback)` - Get available games

### Bot Commands:
- `mode` - Switch between human/robot behavior modes
- `stickers` - View sticker packs
- `conversations` - Manage conversations
- `notifications` - View notifications
- `pages` - Manage pages
- `block` - Block/unblock users
- `games` - View games
- `groups` - Manage groups
- `events` - Manage events
- `autoreact` - Auto react to messages
- `smart` - Smart AI responses
- `monitor` - Monitor bot activity
- `antispam` - Smart anti-spam protection
- `react` - React to messages