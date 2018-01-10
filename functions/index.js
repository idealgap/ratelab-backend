'use strict';

// [START imports]
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const Promise = require('promise');
const md5 = require('md5');

// [END imports]

// [START initialize]
const mailTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: "nav.brar@idealgap.co.nz",
      pass: "123.123.123"
    }
});
const adminEmail = 'jp.proverbio@idealgap.co.nz';

admin.initializeApp(functions.config().firebase);
// [END initialize]

//Send contact us email to rateLab email
exports.notifyQuery = functions.database.ref('/queries/{key}').onWrite(event => {
  if (!event.data.exists()) {
    return null;
  }

  const inquiry = event.data.val();

  var email = {
    from: adminEmail,
    to: adminEmail,
    subject: 'RateLab - New inquiry received',
    html: '<p>You have received a new inquiry. Details: <br/><br/> ' +
    'Name: ' + inquiry.name + '<br/>' +
    'Email: ' + inquiry.email + '<br/>' +
    'Phone: ' + inquiry.phone + '<br/>' +
    'Message: ' + inquiry.message + '<br/><br/><br/></p>'
  };

  return mailTransport.sendMail(email);
});

//Send email to RateLab team about broker sign up
//Send welcome email to new Broker
exports.notifyBrokerSignUp = functions.database.ref('/users/{key}').onWrite(event => {
  if (!event.data.exists()) {
    return null;
  }

  const user = event.data.val();

  var brokerEmail = {
    from: adminEmail,
    to: adminEmail,
    subject: 'RateLab - New broker signed up',
    html: '<p>A new broker has signed up. Details: <br/><br/> ' +
    'Name: ' + user.displayName + '<br/>' +
    'Email: ' + user.email + '<br/>' +
    'Phone: ' + user.phone + '<br/>' +
    'Company: ' + user.company + '<br/>' +
    'FSP: ' + user.fsp + '<br/>' +
    'Address: ' + user.address + '<br/>' +
    'Availability: ' + user.availability + '<br/>' +
    'Accepted Terms: ' + user.acceptedTerms + '<br/>' +
    '<br/><br/></p>'
  };

  mailTransport.sendMail(brokerEmail);

  var welcomeEmail = {
    from: adminEmail,
    to: user.email,
    subject: 'Welcome to RateLab',
    html: '<p>Hi ' + user.displayName + '!<br/><br/> ' +
    'Thank you for joining RateLab platform. Please make sure that your profile contains as much information as possible. <br/>' +
    'Our team will verify your indentity and provided information and then your profile will be activated. <br/><br/>' +
    'Have a great day, <br/>' +
    'RateLab team' +
    '<br/><br/></p>'
  };
  return mailTransport.sendMail(welcomeEmail);
});

//Send email to RateLab team about new application
//Send application confirmation email to customer
//Send application email to broker
exports.notifyApplication = functions.database.ref('/applications/{key}').onWrite(event => {
  if (!event.data.exists()) {
    return null;
  }

  const application = event.data.val();
  const loanType = application.loanType === 'NEW_LOAN' ? 'New loan' : application.loanType === 'REFINANCE' ? 'Refinance' : 'Refix';

  return admin.database().ref('/users/' + application.brokerKey)
    .once('value')
    .then(function(snapshot) {
      const broker = snapshot.val();

      const applicationEmail =
        '<p>A customer has submitted a new loan application. <br/><br/> ' +
        '<strong>Customer details: </strong><br/> ' +
        'Name: ' + application.fullname + '<br/>' +
        'Email: ' + application.email + '<br/>' +
        'Phone: ' + application.phone + '<br/>' +
        'Address: ' + application.address + '<br/><br/>' +

        '<strong>Loan details: </strong><br/>' +
        'Loan type: ' + loanType + '<br/>' +
        'Loan amount: $' + application.loanAmount + '<br/>' +
        'Deposit: $' + application.deposit + '<br/>' +
        'Interest rate: ' + application.interestRate + '%<br/>' +
        'Loan lenght: ' + (application.loanTerm / 12) + ' year/s<br/>' +
        'Repayment: ' + (application.repayment === 12 ? 'Monthly' : application.repayment === 26 ? 'Fortnightly' : 'Weekly') + '<br/>' +
        'Calculated repayment: $' + application.calculatedPayment + '<br/><br/>';

      //Send email to RateLab team about new application
      var rateLabEmail = {
        from: adminEmail,
        to: adminEmail,
        subject: 'RateLab - New loan application',
        html: applicationEmail +
        '<strong>Broker details: </strong><br/>' +
        'Name: ' + broker.displayName + '<br/>' +
        'Email: ' + broker.email + '<br/>' +
        'Phone: ' + broker.phone + '<br/>' +
        'Company: ' + broker.company + '<br/>' +
        'Address: ' + broker.address + '<br/>' +
        '<br/><br/></p>'
      };
      mailTransport.sendMail(rateLabEmail);

      //Send email to broker that a new application has been created for them
      var brokerEmail = {
        from: adminEmail,
        to: broker.email,
        subject: 'RateLab - You have a new loan application',
        html: applicationEmail +
        'RateLab team, <br/><br/></p>'
      };
      mailTransport.sendMail(brokerEmail);

      //Send confirmation email to customer
      var applicationConfirmationEmail = {
        from: adminEmail,
        to: application.email,
        subject: 'RateLab - Loan application',
        html: '<p>Hi ' + application.fullname + '!<br/><br/> ' +
        'We have received your loan details and one of our brokers, ' + broker.displayName + ', will be processing your application and getting in touch with you.<br/><br/>' +
        '<strong>Application details: </strong><br/>' +
        'Loan type: ' + loanType + '<br/>' +
        'Loan amount: $' + application.loanAmount + '<br/>' +
        'Deposit: $' + application.deposit + '<br/>' +
        'Interest rate: ' + application.interestRate + '%<br/>' +
        'Loan lenght: ' + (application.loanTerm / 12) + ' year/s <br/>' +
        'Repayment: ' + (application.repayment === 12 ? 'Monthly' : application.repayment === 26 ? 'Fortnightly' : 'Weekly') + '<br/>' +
        'Calculated repayment: $' + application.calculatedPayment + '<br/><br/>' +
        'Have a great day, <br/>' +
        'RateLab team' +
        '<br/><br/></p>'
      };
      return mailTransport.sendMail(applicationConfirmationEmail);
    }).catch(err => console.log(err.message));
});
