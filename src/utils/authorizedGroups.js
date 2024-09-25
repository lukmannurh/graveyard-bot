// const fs = require('fs');
// const path = require('path');

// const authorizedGroupsFile = path.join(__dirname, '../../authorizedGroups.json');

// function loadAuthorizedGroups() {
//     if (fs.existsSync(authorizedGroupsFile)) {
//         const data = fs.readFileSync(authorizedGroupsFile, 'utf8');
//         return JSON.parse(data);
//     }
//     return [];
// }

// function saveAuthorizedGroups(groups) {
//     fs.writeFileSync(authorizedGroupsFile, JSON.stringify(groups, null, 2));
// }

// function isGroupAuthorized(groupId) {
//     const authorizedGroups = loadAuthorizedGroups();
//     return authorizedGroups.includes(groupId);
// }

// function addAuthorizedGroup(groupId) {
//     const authorizedGroups = loadAuthorizedGroups();
//     if (!authorizedGroups.includes(groupId)) {
//         authorizedGroups.push(groupId);
//         saveAuthorizedGroups(authorizedGroups);
//     }
// }

// function removeAuthorizedGroup(groupId) {
//     let authorizedGroups = loadAuthorizedGroups();
//     authorizedGroups = authorizedGroups.filter(id => id !== groupId);
//     saveAuthorizedGroups(authorizedGroups);
// }

// module.exports = { isGroupAuthorized, addAuthorizedGroup, removeAuthorizedGroup };