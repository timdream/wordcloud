HTML5 Word Cloud
================

Word Cloud on HTML5 canvas, inspired by 
[Wordle](http://www.wordle.net/).

Author: Timothy Chien &lt;timdream@gmail.com&gt;

URL: http://timc.idv.tw/wordcloud/

## Intro

HTML5 Word Cloud is inspired by Wrodle, instead of generate the image 
on a Java Applet, this experiment is entirely on HTML5 canvas.

## Under the hood

This program is composed of three libraries, two of them have 
dependency of jQuery thus they are warped as jQuery plug-ins:

1. `jquery.getcontent.js` which access remote or local content though 
   Google Feed API, YQL data.html (experimental), Facebook Javascript SDK, and FileReader API.
2. `wordfreq.js` which count the phrases/words by running N-gram 
   analysis (for Chinese) and [Porter Stemming Algorithm](http://tartarus.org/~martin/PorterStemmer/) 
   (for English) in Web Workers.
3. finally, `jquery.wordcloud.js` draw the phrases/words on canvas 
   using configured parameters.

Each of the libraries comes with their own tests/demos and are 
designed to be reusable.

Following external libraries are included:

1. Porter Stemming Algorithm in Javascript as mentioned above.
2. [Simulated Web Workers](https://github.com/timdream/simworker) (`worker.js`) 
   to provide a simulated web workers interface in IEs and Mobile Safari.

## Contributors

* [Yuren Ju](https://github.com/yurenju/wordcloud) for Facebook Status fetching

## Q&amp;A

I can be reached by e-mail.