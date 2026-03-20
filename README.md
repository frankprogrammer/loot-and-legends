## Requirements:

Claude Pro Plan $20 a month
Cursor Pro Plan $20 a month

You might be able to get away with free for a bit, but it runs out fast.

## Design

Download the Games Brief as a PDF.

Start a new chat in Claude. At the bottom, set the model to Opus 4.6.
Opus 4.6 thinks harder but has a higher plan usage. Sonnet 4.6 is fine for simpler tasks.

Upload the design pdf and tell Claude that these are your requirements for a "Snackable" game.

Give a base game idea to Claude and then ask it to give you a more flushed out design

## Code

When your design feels good, give Claude this prompt:
I want to build this into a 2D game using Cursor. I want the game to build this with placeholder artwork and run in an HTML5 canvas. Let's use the Phaser framework to develop this. Please give me a prompt that I can put into Cursor that will best allow me to accomplish this. Make sure that I can build this in phases.

If you are building a 3D game, replace "Phaser" with "Three.js"

Install Cursor
https://cursor.com/download

Open an empty folder where your project will live.

Copy over the prompt file that was generated from Claude and put in the root of the project.

Open the Agent tab in Cursor. The chat box should show "Agent" and "Auto"

Give the prompt:
can you save all propmts to a propmts.md file. any that I have done already and all future prompts

Now we will go through each phase and verify the output. Enter:
Build Phase 1

This should output an index.html file that you can double-click on to open in a browser.

After each phase, prompt Cursor with any bug fixes or small tweaks that you want done.
Then move on to the next Phase.

I am currently looking into ChatGPT for artwork generation: https://www.youtube.com/watch?v=wO51cIue9xA

Check out the current build at https://loot-and-legends.franktheprogrammer.workers.dev/
