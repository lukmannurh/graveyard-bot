const fs = require('fs');
const path = require('path');

const authorizedGroupsFile = path.join(__dirname, '../../authorizedGroups.json');

function loadAuthorizedGroups() {
    if (fs.existsSync(authorizedGroupsFile)) {
        const data = fs.readFileSync(authorizedGroupsFile, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

function saveAuthorizedGroups(groups) {
    fs.writeFileSync(authorizedGroupsFile, JSON.stringify(groups, null, 2));
}

function isGroupAuthorized(groupId) {
    const authorizedGroups = loadAuthorizedGroups();
    console.log('Authorized Groups:', authorizedGroups);
    console.log('Checking authorization for group:', groupId);
    return authorizedGroups.includes(groupId);
}

function addAuthorizedGroup(groupId) {
    const authorizedGroups = loadAuthorizedGroups();
    console.log('Current Authorized Groups:', authorizedGroups);
    if (!authorizedGroups.includes(groupId)) {
        authorizedGroups.push(groupId);
        saveAuthorizedGroups(authorizedGroups);
        console.log('Added new group:', groupId);
        console.log('Updated Authorized Groups:', authorizedGroups);
    } else {
        console.log('Group already authorized:', groupId);
    }
}

function removeAuthorizedGroup(groupId) {
    let authorizedGroups = loadAuthorizedGroups();
    authorizedGroups = authorizedGroups.filter(id => id !== groupId);
    saveAuthorizedGroups(authorizedGroups);
}

module.exports = { isGroupAuthorized, addAuthorizedGroup, removeAuthorizedGroup };