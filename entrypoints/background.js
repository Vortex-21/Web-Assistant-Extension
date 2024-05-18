import { WebPDFLoader } from 'langchain/document_loaders/web/pdf';
export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message : ", message);
    if (message.action == "summarizeURL") {
      // chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
      //   const URL = tabs[0].url;
      // });
      const url = message.URL;

      console.log("URL : ", url);
      const fetchApi = async () => {
        try {
          const response = await fetch("http://127.0.0.1:8000/summarize", {
            method: "POST",
            body: JSON.stringify({ url: url }),
            headers: {
              "Content-type": "application/json",
            },
          });
          const data = await response.json();
          console.log(data);
          sendResponse({ summary: data.summary });
        } catch (err) {
          console.log("ERROR: ", err);
          sendResponse({ error: err.message });
        }
      };
      fetchApi();
      //async
      return true;
    } else if (message.action == "summarizeFile") {
      try { 
        const file = message.file;
        const reader=new FileReader();

        reader.onload=async()=>{
          const arrayBuffer = reader.result;

          const blob = new Blob([new Uint8Array(arrayBuffer)],{type:file.type});
          const text = await extractText(blob);
          // const response = await fetch("http://127.0.0.1:8000/summarizePDF", {
          //   method: "POST",
          //   body: JSON.stringify({ text: text }),
          //   headers: {
          //     "Content-type": "application/json",
          //   },

          // });
          // const data = await response.json();
          console.log(text);
          sendResponse({summary:"abcd"});
          // sendResponse({summary:data.summary});
          reader.readAsArrayBuffer(file);
        }
        
      } catch (err) {
        console.log("ERROR extracting text from file: ", err);
        sendResponse({summary:"Error occured"});
      }

      return true;
    }
  });
});
