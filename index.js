/**** General Knowledge Trivia App ****

Built with opentdb and Twilio Voice
Check out more -

Trivia: https://opentdb.com/api_config.php
Twilio Voice: https://www.twilio.com/docs/voice/


*/

//No authentication required use trivia opentdb
const express = require('express');
//const session = require('express-session');
const request = require('request');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const app = express();
const urlencoded = require('body-parser').urlencoded;
const fetch = require('node-fetch');
const base64 = require('base-64');
const utf8 = require('utf8');
const PORT = process.env.PORT || 8001;



let questions = []
let answers = []
let numberOfCorrectAnswer = 0

const url = 'https://opentdb.com/api.php?amount=5&category=9&difficulty=easy&type=boolean&encode=base64';
const getTrivia = async () => {
	try {
		const triviaResponse = await fetch(url)
		if (triviaResponse.ok) {
			const body = await triviaResponse.json()
			let size = body.results.length;

			for (i = 0; i < size; i++) {

				//console.log(i)
				//store the question and answer
				questions.push(body.results[i].question)
				answers.push(body.results[i].correct_answer)

			
			}
			
			return {questions: questions, answers: answers};
		}
		throw new Error('Request failed!')
	}
	catch(error) {
		console.log(error);
	}

}


/*// use session middleware
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));*/

app.use(urlencoded({ extended: false }));

	app.post('/voice', (req, res) => {

		const twiml = new VoiceResponse();

		twiml.pause({length: 1});
		twiml.say({voice:'Polly.Salli'}, 'Welcome to trivia. Listen to the question and answer yes or no.')
		twiml.pause({length: 1});


		twiml.redirect('/trivia')
		
		res.type('text/xml');
		res.send(twiml.toString());

	});

//await getTrivia()
getTrivia()
.then(trivia => {
	numberOfQuestion = questions.length;
	j = 0;

	//Trivia questions/collect answers
	app.post('/trivia', (req, res) => {

		const twiml = new VoiceResponse();

		const gather = twiml.gather ({
		input: 'speech',
		timeout: 5,
		speechTimeout: 1,
		hints: 'yes, no',
		action: '/answer'
		});

		gather.say({voice:'Polly.Salli'}, `There are ${numberOfQuestion - j} questions left.`)
		gather.pause({length: 1});

		//for loops needs to be re built
		//for (j=0; j<numberOfQuestion; j++) {

		//let jj = j;
		//console.log(questions)
		console.log ('the value of j is ' + j)

		let encodedQuestion = questions[j];
		let bytesQuestion = base64.decode(encodedQuestion);
		var textQuestion = utf8.decode(bytesQuestion);
		console.log(textQuestion);

		gather.say({voice:'Polly.Salli'}, `${textQuestion}, yes or no`)

		twiml.redirect('/trivia')
		
		//} //end of for loop

		res.type('text/xml');
		res.send(twiml.toString());

	});

	//Store the user answers and check if it's correct
	app.post('/answer', (req, res) => {

		const twiml = new VoiceResponse();

		//for loops starting
		//for (j=0; j<numberOfQuestion; j++) {

			//let jj = j;

			if (req.body.SpeechResult) {
				let answer = req.body.SpeechResult.toLowerCase();
				//twiml.say({voice:'Polly.Salli'}, `You answered ${answer}`);
				console.log(answer);

				let encodedAnswer = answers[j];
				let bytesAnswer = base64.decode(encodedAnswer);
				let textAnswer = utf8.decode(bytesAnswer);

				console.log("correct answer " + textAnswer.toLowerCase());
				//req.session.answer = answer; //store the speech result to a session data to refer later
				//twiml.say({voice:'Polly.Salli'}, 'the correct answer is ' + answers[j]);

				if (answer == 'yes.' || answer == 'yeah.' || answer == 'sure.' || answer == 'correct.' || answer == 'right.') {

					answer = 'true';
				}
				else {

					answer = 'false';

				}

				if (answer == textAnswer.toLowerCase()) {

					twiml.say({voice:'Polly.Salli'},'You answered correctly!')
					numberOfCorrectAnswer = numberOfCorrectAnswer + 1;


					if (j < numberOfQuestion - 1) {
						j = j + 1;
						twiml.say({voice:'Polly.Salli'},'Next question')
						twiml.pause({length: 1});
						twiml.redirect('/trivia');
					}
					
					else {
						twiml.pause({length: 1});
						twiml.say({voice:'Polly.Salli'},`Thank you, you answered ${numberOfCorrectAnswer} questions correctly!`)
						twiml.pause({length: 2});
					}
				}

				else {

					twiml.say({voice:'Polly.Salli'},'Sorry, you did not answer correctly!')

					if (j < numberOfQuestion - 1) {
						j = j + 1;
						//twiml.say({voice:'Polly.Salli'},'Next question')
						twiml.redirect('/trivia');
					}

					else {
						twiml.pause({length: 1});
						twiml.say({voice:'Polly.Salli'},`Thank you, you answered ${numberOfCorrectAnswer} questions correctly!`)
						twiml.pause({length: 2});
					}
				}
			}

			else {
				console.log('You did not answer')
				twiml.redirect('/trivia');
			}

		//} //end of for loops
		
		res.type('text/xml');
		res.send(twiml.toString());

	})

});

app.listen(PORT, () => console.log(`listening on port ${ PORT }`));







