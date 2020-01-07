module.exports = [
    {
        id: "identifier",
        icon: "<i class='fas fa-user-tag'></i>",
        reward: 50,
        title: "Register Identifier",
        event: "register identifier",
        description: "Not a robot? It's not that we don't like robots, but we can't afford to keep paying them money and still have tokens for numans that want.",
        completed: false,
        action: function(app){app.modules.returnModule('Tutorial').registerIdentifierModal();},
    },
    {
        id: "backup",
        icon: "<i class='fas fa-download'></i>",
        reward: 50,
        title: "Backup Wallet",
        event: "user wallet backup",
        description:"Backup your wallet and we'll send you a heap of Saito tokens, enough to use the network for a long, long, time. Backing up your wallet is important as it provides you with the ability to restore your account.",
        completed: false,
        action: function(app){app.modules.returnModule('Tutorial').welcomeBackupModal();},
    }
];
