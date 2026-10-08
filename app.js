(() => {
  'use strict';
  const config = window.INDUCTION;
  const sections = config.sections;
  const total = sections.length;
  const key = 'applebridge-induction-' + config.version;
  const $ = id => document.getElementById(id);
  let state = {started:false, reviewed:0, current:0, quizPasses:{}};
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Number.isInteger(saved.reviewed) && Number.isInteger(saved.current)) {
      state.reviewed = Math.max(0, Math.min(total, saved.reviewed));
      state.current = Math.max(0, Math.min(state.reviewed, saved.current));
      state.started = saved.started === true;
      state.quizPasses = saved.quizPasses && typeof saved.quizPasses === 'object' ? saved.quizPasses : {};
      // Added or changed quizzes invalidate progression beyond an unpassed quiz.
      for (let i = 0; i < state.reviewed; i++) {
        if (!passed(sections[i])) { state.reviewed = i; state.current = Math.min(state.current, i); break; }
      }
    }
    localStorage.setItem(key, JSON.stringify(state));
  } catch { storageAvailable = false; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { storageAvailable = false; }
    $('storage-note').hidden = storageAvailable;
  }
  function focusHeading() {
    const heading = $('section-content').querySelector('h2');
    heading.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function formUrl() {
    try {
      const url = new URL(config.formUrl);
      // Accept Microsoft Forms and Microsoft short links only.
      const allowed = ['forms.office.com','forms.cloud.microsoft','forms.microsoft.com'];
      return url.protocol === 'https:' && allowed.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function quizFor(section) {
    if (!section || !section.quiz) return null;
    const quiz = section.quiz;
    if (!Array.isArray(quiz.questions) || !quiz.questions.length ||
        quiz.questions.some(q => !q.question || !Array.isArray(q.options) || q.options.length < 2 ||
          !Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
      return {invalid:true};
    }
    const passMark = quiz.passMark ?? quiz.questions.length;
    if (!Number.isInteger(passMark) || passMark < 1 || passMark > quiz.questions.length) return {invalid:true};
    return {...quiz, passMark};
  }
  function quizKey(section) { return JSON.stringify([section.id, section.quiz]); }
  function passed(section) {
    const quiz = quizFor(section);
    return !quiz || (!quiz.invalid && state.quizPasses[quizKey(section)] === true);
  }
  function renderQuiz(section, body) {
    const quiz = quizFor(section);
    if (!quiz) return;
    const panel = document.createElement('section'); panel.className = 'quiz';
    const title = document.createElement('h3'); title.textContent = 'Knowledge check'; panel.append(title);
    if (quiz.invalid) {
      const warning = document.createElement('p'); warning.textContent = 'This knowledge check is unavailable. Please contact your line manager.';
      panel.append(warning); body.append(panel); return;
    }
    const instructions = document.createElement('p');
    instructions.textContent = `Answer the questions below. You need ${quiz.passMark} out of ${quiz.questions.length} correct to continue.`;
    panel.append(instructions);
    if (passed(section)) {
      const success = document.createElement('p'); success.className = 'quiz-result quiz-pass'; success.textContent = 'Knowledge check passed. You can continue to the next section.';
      panel.append(success); body.append(panel); return;
    }
    const form = document.createElement('form');
    const groups = [];
    quiz.questions.forEach((q, i) => {
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend'); legend.textContent = `${i + 1}. ${q.question}`; fieldset.append(legend);
      const inputs = [];
      q.options.forEach((option, j) => {
        const label = document.createElement('label'); label.className = 'quiz-option';
        const input = document.createElement('input'); input.type = 'radio'; input.name = `quiz-${i}`; input.value = j;
        const text = document.createElement('span'); text.textContent = option;
        label.append(input, text); fieldset.append(label); inputs.push(input);
      });
      const feedback = document.createElement('p'); feedback.className = 'quiz-feedback'; feedback.hidden = true;
      feedback.id = `quiz-feedback-${i}`; fieldset.setAttribute('aria-describedby', feedback.id);
      fieldset.append(feedback); form.append(fieldset); groups.push({inputs, feedback});
    });
    const result = document.createElement('p'); result.className = 'quiz-result'; result.setAttribute('role','status'); result.setAttribute('aria-live','polite');
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'button'; submit.textContent = 'Check answers';
    form.append(result, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const missing = groups.find(g => !g.inputs.some(input => input.checked));
      if (missing) {result.textContent = 'Please answer every question before checking your answers.'; missing.inputs[0].focus(); return;}
      let score = 0;
      groups.forEach((g, i) => {
        const q = quiz.questions[i];
        const correct = g.inputs[q.correctAnswer].checked;
        if (correct) score++;
        g.feedback.hidden = false;
        g.feedback.textContent = (correct ? 'Correct. ' : 'Try again. ') + (q.explanation || '');
        g.feedback.className = 'quiz-feedback ' + (correct ? 'quiz-pass' : 'quiz-retry');
      });
      if (score >= quiz.passMark) {
        state.quizPasses[quizKey(section)] = true; save();
        result.textContent = `You scored ${score} out of ${quiz.questions.length}. Passed — you can now continue.`;
        result.className = 'quiz-result quiz-pass'; submit.hidden = true;
        groups.forEach(g => g.inputs.forEach(input => {input.disabled = true;}));
        $('next').disabled = false;
      } else {
        result.textContent = `You scored ${score} out of ${quiz.questions.length}. Review the feedback, change your answers and try again.`;
        result.className = 'quiz-result quiz-retry'; submit.textContent = 'Check answers again';
      }
    });
    panel.append(form); body.append(panel);
  }

  function render() {
    const index = state.current;
    const finished = index === total;
    const section = sections[index];
    $('welcome').hidden = true;
    $('journey').hidden = false;
    $('progress').max = total;
    $('progress').value = state.reviewed;
    $('progress-text').textContent = `${state.reviewed} of ${total} reviewed`;
    $('percent').textContent = Math.round(state.reviewed / total * 100) + '%';
    $('steps').replaceChildren();
    [...sections, {title:'Complete your induction'}].forEach((item,i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      const done = i < state.reviewed;
      button.type = 'button';
      button.disabled = i > state.reviewed;
      if (i === index) button.setAttribute('aria-current','step');
      if (done) li.className = 'done';
      const marker = document.createElement('span');
      marker.className = 'marker';
      marker.setAttribute('aria-hidden','true');
      marker.textContent = done ? '✓' : i === total ? 'F' : String(i+1).padStart(2,'0');
      const label = document.createElement('span');
      label.textContent = item.title;
      const status = document.createElement('span');
      status.className = 'step-state';
      status.textContent = done ? 'Reviewed' : i === index ? 'Current section' : i > state.reviewed ? 'Locked' : 'Ready';
      label.append(status); button.append(marker,label); li.append(button);
      button.addEventListener('click',() => { if(i <= state.reviewed){state.current=i;save();render();focusHeading();} });
      $('steps').append(li);
    });
    $('section-number').textContent = finished ? 'FINAL STEP' : `SECTION ${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    $('section-time').textContent = finished ? 'Microsoft Forms' : section.time;
    const article = $('section-content');
    article.replaceChildren();
    const h2 = document.createElement('h2'); h2.tabIndex = -1;
    h2.textContent = finished ? 'COMPLETE YOUR INDUCTION.' : section.heading; article.append(h2);
    const body = document.createElement('div');
    if (finished) {
      body.innerHTML = '<span class="complete-badge">All sections reviewed</span><p class="lead" style="margin-top:24px">You’re ready to complete the final induction form.</p><p>Open Microsoft Forms using the button below, fill in your details and submit your responses. The form opens in a new tab so you can return to this page if needed.</p>';
      const url = formUrl();
      if(url) {
        const link = document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.className='button';link.textContent='Open induction form (new tab)';body.append(link);
      } else {
        const note = document.createElement('div'); note.className='notice';note.textContent='The induction form is not available yet. Please contact your line manager or HR for the link to complete your induction.';body.append(note);
      }
      const note = document.createElement('p'); note.className='small';note.style.marginTop='20px';note.textContent='Your induction is complete once you have submitted the Microsoft Form. This page cannot check whether your response has been submitted.';body.append(note);
    } else {
      body.innerHTML = section.body;
      if(section.imageUrl){const img=document.createElement('img');img.src=section.imageUrl;img.alt=section.imageAlt||'';img.className='content-image';body.append(img);}
      if(section.videoUrl){
        let media;
        if(section.videoType==='embed'){media=document.createElement('iframe');media.src=section.videoUrl;media.title=section.title+' video';media.allow='fullscreen; picture-in-picture';media.allowFullscreen=true;media.className='video';}
        else{media=document.createElement('video');media.src=section.videoUrl;media.controls=true;media.preload='metadata';media.className='video';if(section.captionsUrl){const track=document.createElement('track');track.kind='captions';track.src=section.captionsUrl;track.srclang='en';track.label='English';track.default=true;media.append(track);}}
        body.prepend(media);
      }
    }
    if (!finished) renderQuiz(section, body);
    article.append(body);
    $('back').disabled=index===0;
    $('next').hidden=finished;
    $('next').disabled = finished || !passed(section);
    $('next').textContent=index===total-1?'Finish sections':'Next section';
    $('step-caption').textContent=finished?'Submit the form to finish':`${index+1} of ${total}`;
    $('storage-note').hidden=storageAvailable;
    $('announcement').textContent=finished?'All sections reviewed. The induction form is now unlocked.':`Section ${index+1} of ${total}: ${section.title}`;
  }
  $('duration').textContent=config.estimatedTime;
  $('section-count').textContent=total+' sections';
  if(state.started){$('start').textContent='Continue my induction';$('resume-note').textContent=`You have reviewed ${state.reviewed} of ${total} sections. Continue where you left off.`;}
  $('start').addEventListener('click',()=>{state.started=true;save();render();focusHeading();});
  $('next').addEventListener('click',()=>{if(state.current>=total || !passed(sections[state.current]))return;state.reviewed=Math.max(state.reviewed,state.current+1);state.current++;save();render();focusHeading();});
  $('back').addEventListener('click',()=>{if(state.current>0){state.current--;save();render();focusHeading();}});
  $('restart').addEventListener('click',()=>{if(!confirm('Start your induction again? Your saved progress on this browser will be cleared.'))return;state={started:true,reviewed:0,current:0, quizPasses:{}};save();render();focusHeading();});
})();
