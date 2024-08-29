// It's not working when you first deploy it and hit Enter. Async functions error?

import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;
const wordAPIURL = "https://wordsapiv1.p.rapidapi.com/words/";
const imageSearchAPIURL = "https://real-time-image-search.p.rapidapi.com/search";
const config = {
  headers: { 
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": "wordsapiv1.p.rapidapi.com"
  }
};

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/search-result", async (req, res) => {
    let wordSearched, image, imageWidth, imageHeight;
    try {

        // Contain the search or random word.

        if (req.body.searchButton) {
            wordSearched = req.body.word;
        } else if (req.body.randomWord) {
            const randomWordObject = await axios.get(wordAPIURL, {
                params: { random: "true" },
                ...config
            });
            wordSearched = randomWordObject.data.word;
        }

        // Make the API requests based on that word.

        const [wordDefinitions, wordSyllables, wordPronunciation, wordExamples, wordSynonyms, wordAntonyms, wordRhymes, wordFrequency] = await Promise.all([
            axios.get(`${wordAPIURL}${wordSearched}/definitions`, config),
            axios.get(`${wordAPIURL}${wordSearched}/syllables`, config),
            axios.get(`${wordAPIURL}${wordSearched}/pronunciation`, config),
            axios.get(`${wordAPIURL}${wordSearched}/examples`, config),
            axios.get(`${wordAPIURL}${wordSearched}/synonyms`, config),
            axios.get(`${wordAPIURL}${wordSearched}/antonyms`, config),
            axios.get(`${wordAPIURL}${wordSearched}/rhymes`, config),
            axios.get(`${wordAPIURL}${wordSearched}/frequency`, config),
        ]);

        // Ternary operator to manage the content coming from API.

        const syllables = (wordSyllables.data.syllables.count > 0 && wordSyllables.data.syllables.list.length > 0)
            ? wordSyllables.data.syllables
            : "No available syllables.";
        const pronunciation = (wordPronunciation.data.pronunciation?.all?.length > 0)
            ? wordPronunciation.data.pronunciation.all
            : "No available pronunciation.";
        const definitions = (wordDefinitions.data.definitions?.length > 0)
            ? wordDefinitions.data.definitions
            : "No available definition.";
        const examples = (wordExamples.data.examples?.length > 0)
            ? wordExamples.data.examples
            :"No available examples.";
        const synonyms = (wordSynonyms.data.synonyms?.length > 0)
            ? wordSynonyms.data.synonyms
            : "No available synonyms.";
        const antonyms = (wordAntonyms.data.antonyms?.length > 0)
            ? wordAntonyms.data.antonyms
            : "No available antonyms.";
        const rhymes = (wordRhymes.data.rhymes?.all?.length > 0)
            ? wordRhymes.data.rhymes.all
            : "No available rhymes.";
        const frequency = (wordFrequency.data.frequency?.zipf > 0)
            ? wordFrequency.data.frequency.zipf
            : "No available frequency data.";
        
        // 'try...catch' statement to make a separate request to the image's API.

            try {
            const imageSearch = await axios.get(imageSearchAPIURL, {
                params: {
                    query: wordSearched,
                    size: "any",
                    color: "any",
                    type: "any",
                    time: "any",
                    usage_rights: "any",
                    file_type: "any",
                    aspect_ratio: "any",
                    country: "us",
                    safe_search: "off",
                    region: "us"
                },
                headers: {
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                    "x-rapidapi-host": "real-time-image-search.p.rapidapi.com"
                }
            });
            image = imageSearch.data.data[0].url;
            imageWidth = imageSearch.data.data[0].width;
            imageHeight = imageSearch.data.data[0].height;
        } catch (error) {
            console.log(error.message);
            image = "Limit reached.";
        }
        
        res.render("search-result.ejs", {
            word: wordSearched,
            syllables,
            pronunciation,
            definitions,
            examples,
            synonyms,
            antonyms,
            rhymes,
            frequency,
            image,
            imageWidth,
            imageHeight
        });
        
    } catch (error) {
        console.log(error.message);
        let errorMessage;
        if (error.message === "Request failed with status code 404") {
            errorMessage = "Please check the spelling or try another word.";
        } else {
            errorMessage = "An unexpected error has occurred. Please try again.";
        };
        res.render("index.ejs", { errorMessage });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});