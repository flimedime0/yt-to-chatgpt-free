chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'TRANSCRIPT_READY') {
    handleTranscript(msg).catch(console.error);
  }
});

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get({
      systemPrompt: 'You are a concise expert summarizer.',
      userInstructions: 'Summarize the transcript into key takeaways and actions.'
    }, resolve);
  });
}

function buildPrompt(settings, videoInfo, transcript) {
  cons`t header = `VIDEO: ${videoInfo.title}\nCHANNEL: ${videoInfo.channel}\nURL: ${videoInfo.url}`;
  return [
    header,
    '',
    'SYSTEM INSTRUCTIONS:',
    settings.systemPrompt,
    '',
    'USER INSTRUCTIONS:',
    settings.userInstructions,
    '',
    'TRANSCRIPT:',
    transcript
  ].join('\n');
}

async function handleTranscript({ videoInfo, transcript }) {
  const settings = await getSettings();
  const prompt = buildPrompt(settings, videoInfo, transcript);
  try {
    await navigator.clipboard.writeText(prompt);
  } catch (e) {
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    await chrome.tabs.create({ url });
  }
  await chrome.tabs.create({ url: 'https://chat.openai.com/' });
  await chrome.storage.session.set({ latestResult: { prompt, videoInfo } });
  chrome.action.openPopup();
}
