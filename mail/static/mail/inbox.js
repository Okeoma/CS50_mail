document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// load mailbox for inbox, Sent and Archive mails
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';   
  
  const emails_view = document.querySelector("#emails-view");
  // Show the mailbox name
  emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;  

  // Sending a GET request to /emails/<mailbox> where <mailbox> is either inbox, sent, or archive
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {

    //Create and append inbox and archive email headers
	if (mailbox === 'inbox' || mailbox === 'archive' ) {
	let table = document.createElement("table");
    let tr = document.createElement("tr");
	
	let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    let th3 = document.createElement("th");
	
	th1.className = "th1Col";
	th2.className = "th2Col";
	th3.className = "th3Col";
	
	th1.textContent = 'Sender';
    th2.textContent = 'Subject';
    th3.textContent = 'Date/Time';
	
	tr.appendChild(th1);
    tr.appendChild(th2);
    tr.appendChild(th3);
	
	table.appendChild(tr);
	
    emails_view.appendChild(table);		
	
	let hr = document.createElement('hr');	
	emails_view.appendChild(hr);
	
	// generate div for each email(inbox and archive)
    emails.forEach(email => {
        let div = document.createElement('div');
        div.className = email['read'] ? "email-list-item-read" : "email-list-item-unread";
        div.innerHTML = `
            <span class="sender col-3"> <b>${email['sender']}</b> </span>
            <span class="subject col-6">${email['subject']}</span>
            <span class="timestamp col-3"> ${email['timestamp']} </span>
        `;

        // add click event listener and append		
        div.addEventListener('click', () => display_email(email['id']));
        emails_view.appendChild(div);
    });	
	}
	
	//Create and append sent email header
	if (mailbox === 'sent') {
	let table = document.createElement("table");
    let tr = document.createElement("tr");
	
	let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    let th3 = document.createElement("th");
	
	th1.className = "th1Col";
	th2.className = "th2Col";
	th3.className = "th3Col";
	
	th1.textContent = 'Recipient';
    th2.textContent = 'Subject';
    th3.textContent = 'Date/Time';
	
	tr.appendChild(th1);
    tr.appendChild(th2);
    tr.appendChild(th3);
	
	table.appendChild(tr);
	
    emails_view.appendChild(table);		
	
	let hr = document.createElement('hr');	
	emails_view.appendChild(hr);
	// generate div for each email(sent)
    emails.forEach(email => {
        let div = document.createElement('div');
        div.className = email['read'] ? "email-list-item-read" : "email-list-item-unread";
        div.innerHTML = `
            <span class="recipients col-3"> <b>${email['recipients']}</b> </span>
            <span class="subject col-6"> ${email['subject']} </span>
            <span class="timestamp col-3"> ${email['timestamp']} </span>
        `;

        // add click event listener and append	
        div.addEventListener('click', () => display_sentbox(email['id']));
        emails_view.appendChild(div);
    });
	}
	
  })
}

//Display email for Inbox and Archive
function display_email(id) {
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {

    // show email message and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';

    // display email  
    const read_view = document.querySelector('#read-view');
    read_view.innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><b>Sender:</b> <span>${email['sender']}</span></li>
        <li class="list-group-item"><b>Recipient: </b><span>${email['recipients']}</span></li>
        <li class="list-group-item"><b>Subject:</b> <span>${email['subject']}</span</li>
        <li class="list-group-item"><b>Date and Time:</b> <span>${email['timestamp']}</span></li>
      </ul>
      <p class="m-2">${email['body']}</p>
    `;

    // create reply button and append
    let replyButton = document.createElement('button');
    replyButton.className = "btn-primary m-1";
    replyButton.innerHTML = "Reply";
    replyButton.addEventListener('click', function() {
      compose_email();

      // populate fields with data from email
      document.querySelector('#compose-recipients').value = email['sender'];
      let subject = email['subject'];
      console.log(subject.split(" ", 1)[0]);
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      let body = `On ${email['timestamp']}, ${email['sender']} wrote:\n${email['body']}`;
      document.querySelector('#compose-body').value = body;

    });
    
	// create "mark as unread" button and append
    let unreadButton = document.createElement('button');
    unreadButton.className = "btn-secondary m-1";
    unreadButton.innerHTML = "Mark as Unread"
    unreadButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : false })
      })
      .then(response => load_mailbox('inbox'))
    })  
	
	// create archive button
    let archiveButton = document.createElement('button');
    archiveButton.className = "btn-primary m-1";
    archiveButton.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
    archiveButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ archived : !email['archived'] })
      })
      .then(response => load_mailbox('inbox'))
    });      	
	
    read_view.appendChild(replyButton); // append reply button to DOM
    read_view.appendChild(unreadButton); // append "mark as unread" button to DOM
	read_view.appendChild(archiveButton); // append archive button to DOM

    // mark email as read
    if (!email['read']) {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({
		read : true })
      })
    }    
  });
}

//Display Email for sentbox
function display_sentbox(id) {
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {

    // show email message and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';

    // display email  
    const read_view = document.querySelector('#read-view');
    read_view.innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><b>Sender:</b> <span>${email['sender']}</span></li>
        <li class="list-group-item"><b>Recipient: </b><span>${email['recipients']}</span></li>
        <li class="list-group-item"><b>Subject:</b> <span>${email['subject']}</span</li>
        <li class="list-group-item"><b>Date and Time:</b> <span>${email['timestamp']}</span></li>
      </ul>
      <p class="m-2">${email['body']}</p>
    `;

    // create reply button
    let replyButton = document.createElement('button');
    replyButton.className = "btn-primary m-1";
    replyButton.innerHTML = "Reply";
    replyButton.addEventListener('click', function() {
      compose_email();

      // populate fields with data from email
      document.querySelector('#compose-recipients').value = email['sender'];
      let subject = email['subject'];
      console.log(subject.split(" ", 1)[0]);
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      let body = `On ${email['timestamp']}, ${email['sender']} wrote:\n${email['body']}`;
      document.querySelector('#compose-body').value = body;

    });     
		
	// create "mark as unread" button
    let unreadButton = document.createElement('button');
    unreadButton.className = "btn-secondary m-1";
    unreadButton.innerHTML = "Mark as Unread"
    unreadButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : false })
      })
      .then(response => load_mailbox('inbox'))
    })   
    read_view.appendChild(replyButton); // append reply button to DOM
    read_view.appendChild(unreadButton); // append "mark as unread" button to DOM

    // mark email as read
    if (!email['read']) {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({
		read : true })
      })
    }
    
  });
}


function send_email(event) {
 
  event.preventDefault()

  // Post email to API route
  fetch('/emails' , {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  }) 
    
  .then(response => load_mailbox('sent'));  
}