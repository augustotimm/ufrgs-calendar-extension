import nodemailer from 'nodemailer';

// Generate SMTP service account from ethereal.email
export function sendCalendarMessage (calendar) {

    console.log('Credentials obtained, sending message...');

    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
        host: 'smtp.mailersend.net',
        port: 587,
        auth: {
            user: 'MS_8YqKGc@trial-0r83ql3jzzxgzw1j.mlsender.net',
            pass: 'tKdnqquTLohrEETe'
        }
    });

    // Message object
    let message = {
        from: 'MS_8YqKGc@trial-0r83ql3jzzxgzw1j.mlsender.net',
        to: 'augusto.timm@gmail.com',
        subject: 'Appointment',
        text: 'Please see the attached appointment',
        icalEvent: {
            filename: 'invitation.ics',
            method: 'request',
            content: calendar.toString()
        }
    };

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
        }

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}