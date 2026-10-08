# Applebridge Family induction

Plain HTML, CSS and JavaScript. No install, build step, framework or database required.

## Run locally
Unzip the package and open index.html in a browser. For a local web server, run `python -m http.server 8000` in the extracted folder and visit http://localhost:8000.

## Before issuing to new starters
1. Open content.js. Replace the sample section bodies with approved induction content.
2. Set formUrl to your full HTTPS Microsoft Forms link. Until configured, the final page displays a helpful message rather than an invalid link.
3. Update estimatedTime to match the actual content and videos.
4. Add your real logo if wanted: replace the text-based .brand element in index.html with an image, and adjust its size in styles.css.
5. Increase version in content.js when content changes should reset existing progress.

## Edit sections
The sections array in content.js controls titles, headings, reading time, and content. Add/remove/reorder entries there; progress navigation updates automatically. Each id should be unique. The body field accepts HTML that you author. Do not populate it with untrusted user input.

For a local video add `videoUrl: 'assets/welcome.mp4', videoType: 'file'` to a section. Put the file in an assets folder beside index.html. Use `captionsUrl: 'assets/welcome.vtt'` for captions. For YouTube use an embed URL with videoType: 'embed'. YouTube may restrict local-file playback; test from your hosted domain. Ensure videos have captions or provide a transcript in the section body.

For images use `imageUrl: 'assets/team.jpg', imageAlt: 'Description of the image'`.

Rajdhani Bold and Roboto Regular load from Google Fonts. Internet access is required for these fonts and embedded media; system fonts are the fallback. To make the fonts available offline, host licensed WOFF2 files locally and use @font-face.

## Publish on your own hosting
Upload index.html, styles.css, content.js, app.js and any assets together to your web hosting folder, preserving their relative paths. No PHP or Node server is needed.

## How progress works
Next section marks the current section as reviewed and unlocks the next one. Reviewed sections can be revisited. Progress is stored only on the current browser/device. Start again clears that progress after confirmation. On a shared computer, restart between users. Private browsing or cleared browser data may remove progress.

The final form is unlocked after all sections are reviewed. Clicking through is not proof that someone has read or watched the content. This client-side sequence is a guidance aid, not secure compliance enforcement. There are no accounts, central completion records or automatic HR emails in this site. Microsoft Forms owns the submitted response; configure response notifications or a Power Automate flow separately if HR needs an email. Opening the form never marks it submitted in this site.

The time estimate and six sections are sample starting points. Replace with your approved content before use.
