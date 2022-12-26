***********************************************

/signup
method: POST
body: {
        "email": "holmes.career@gmail.com",
        "password": "9026040An!",
        "name": "Ahmed Naeem",
        "phone": "923342224425"
    }

***********************************************

/login
method: POST
body: {
        "email": "ahmednaeem.career@gmail.com",
        "password": "9026040An!"
    }

***********************************************

/message
method: POST
body: {
        "type": "text",
        "message": "hello motto!",
        "uid": "MdMPYqY9q3gq4e7NyJgFpgonBw83",
        "alogrithm": "openai"
    }

Note: You will obtain the uid in the response 
of the login API
AND
"alogrithm" is optional. But right now you have
to pass openai as my midjourney trial is over.

***********************************************

/credit
method: POST
body: {
    "uid": "Arb6HLstYVOMCPv7ZivMAAXc2kr1",
    "credit": 1000
  }


***********************************************

/debit
method: POST
body: {
    "uid": "Arb6HLstYVOMCPv7ZivMAAXc2kr1",
    "credit": 1000
  }


***********************************************

/invite
method: POST
body: {
    "uid": "gJ4A9YR15RC2EU6heyHRMh4zVN2",
    "friend": "ahmed@gmail.com"
  }

***********************************************

/subscription
method: POST
body: {
    "uid": "gJ4A9YR15RC2EU6heyHRMh4zVN2",
    "subscription": 1
  }

Note: subscription can be 1 (type 1)/ 2 (type 2) 

***********************************************

/message_history/UID_HERE
method: GET
body: None

example: http://localhost:4000/message_history/9QdHm1UVk6PWLYvUcNRwXjxCp0x1

/qrcode
method: GET
body: None

