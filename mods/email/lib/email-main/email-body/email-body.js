const EmailForm          = require('./email-form/email-form');
const EmailDetail        = require('./email-detail/email-detail');
const EmailAppspace         = require('./email-appspace/email-appspace');
const EmailAppspaceTemplate = require('./email-appspace/email-appspace.template.js');
const EmailListTemplate     = require('./email-list/email-list.template.js');


module.exports = EmailBody = {

    app: {},

    render(app, mod) {

        mod.body = this;

        switch(mod.active) {
            case "email_list":
                EmailList.render(app, mod);
                EmailList.attachEvents(app, mod);
                break;
            case "email_form":
                EmailForm.render(app, mod);
                EmailForm.attachEvents(app, mod);
                break;
            case "email_detail":
                EmailDetail.render(app, mod);
                EmailDetail.attachEvents(app, mod);
                break;
            case "email_appspace":
                document.querySelector('.email-body').innerHTML = EmailAppspaceTemplate();
                EmailAppspace.render(app, mod);
                EmailAppspace.attachEvents(app, mod);
                break;
            default:
                break;
        }
    },

    attachEvents(app, mod) {
        if (document.querySelector('#email.create-button')) {
            document.querySelector('#email.create-button')
            .addEventListener('click', (e) => {
                mod.active = "email_form";
                mod.previous_state = "email_list";
                mod.main.render(app, mod);
                mod.main.attachEvents(app, mod);
            });
        }
    }
}

