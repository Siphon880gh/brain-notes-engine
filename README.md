# Gamified Knowledge: Snippets, Guides, and Tutorials

By Weng Fei Fung. Great for studying (like biology), collecting code snippets (for programming), or full-blown tutorials. Each folder is a concept. Each nested folder is a deeper concept. This tool shows those folders of information such as openable links and/or your own html code and/or document files and/or images, as well as your own summary that lets you jump to other concepts. 

## Live Demo

Please [try it out](http://wengindustry.com/tools/gamified-knowledge/)

## Organizing the folders and files

Folders of MD files. For a beefed up version that is more than MD files, you can have .JSON files. Take a look at JSON Example section below. Place these in curriculum/.

Note that the curriculum at this repo is empty but the deployed app still renders content at <a target="_blank" href="https://wengindustry.com/tools/gamified-knowledge/">the demo</a>. For the curriculum content, visit my [Coding Snipppets and Guides repository](https://github.com/Siphon880gh/code-wiki). I chose to separate the content so people can contribute guides and snippets more easily. My deployment server automatically combines this repo with the curriculum repo as a pipeline.

### JSON Example

```
{
    "titleOverridden": "I overridden",
    "desc": "HTML or text description here",
    "summary": ["<b>This is <u>text</u>.</b> It is in the json file as an array of strings that will be will separated as <br> lines when rendered. ",
                "And you can jump to a text containing title ",
                "<a href=\"javascript:void(0)\" onclick=\"scrollToText('I overridden')\">I overridden</a>"
               ],
    "footerFile": "./test.txt",
    "gotos": [
        ".",
        "./readme.md",
        "http://www.google.com"
    ]
}
```

## Referring to other notes from a note

You can jump to different concepts from a summary.
```
"<a href=\"javascript:void(0)\" onclick=\"scrollToText('I overridden')\">I overridden</a>"
```

## Searching snippets

You can search by topic title or contents. The search bars are to the top of the topics explorer. This tool uses pcregrep to search files.

## Future Features
- In the future, you can store your ratings for each folder based on how important (thermometer) and your mastery (parentheses = maybe will fail, square brackets = definitely failed, checked = recalled well).
- If many users find this helpful, I'll improve loading performance by having a JSON cache mechanism that refreshes whenever the lessons are modified.

### Future Feature: Thermometer
The thermometer upon clicking goes from empty, to partially filled, to completely filled, and you can make it to mean whatever you want. It could mean how important the concept is to focus on.

### Future Feature: Multistate
To the right is possibly a blank area enclosed by left and right gray vertical bars. There are actually four slots inside these bars. Clicking a slot will cycle through blank, parentheses and square brackets. They could mean unaddressed (blank), will need to review again until commits to memory (parentheses), and will need extra reviewing because it's having problems sticking (square brackets). When you complete a concept knowing that it's committed to memory, you can SHIFT+click, right-click or taphold (if on a phone), to add a checkmark to any of those states. So you can have something like a parentheses with checkmark inside. This will let you know the history of how hard a concept was.