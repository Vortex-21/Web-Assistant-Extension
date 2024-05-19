// import { PDFJS } from "pdf-parse/lib/pdf.js/v1.10.100/build/pdf";
import "./style.css";

// import extractTextFromPDF from "pdf-parser-client-side";

// const { pdfjs } = require("react-pdf");
// import {pdfjsWorker} from "pdfjs-dist/build/pdf.worker.entry";
// pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker; // Path to the pdf.worker.js file

import { pdfjs } from "react-pdf";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    //   'pdfjs-dist/build/pdf.worker.min.js',
    //   import.meta.url,
    // ).toString();
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    const extractTextFromPDF = async (file) => {
      try {
        // Create a blob URL for the PDF file
        const blobUrl = URL.createObjectURL(file);

        // Load the PDF file
        const loadingTask = pdfjs.getDocument(blobUrl);

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        let extractedText = "";

        // Iterate through each page and extract text
        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          extractedText += pageText;
        }
        if (extractedText.length > 0) {
          return extractedText;
        }
        console.error("Error extracting text from PDF:", error);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
      }
    };

    
    async function serialize(src) {
      const wasBlob = src instanceof Blob;
      const blob = wasBlob ? src : await new Response(src).blob();
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => resolve([reader.result, blob.type, wasBlob]);
        reader.readAsDataURL(blob);
      });
    }

    const displaySummary = (summary, container) => {
      const button = container.querySelector("#summarize-button");
      button.innerText = "Sum up this web Page!";

      // const optionsBox = container.querySelector("#options");
      const summaryBox = document.createElement("div");
      summaryBox.id = "summary-box";
      summaryBox.style.cssText =
        "top: " +
        (container.offsetTop + container.offsetHeight + 10) +
        "px; right: " +
        (document.body.offsetWidth -
          container.offsetLeft -
          container.offsetWidth) +
        "px; ";

      const closeButton = document.createElement("button");

      closeButton.innerText = "Close";
      closeButton.id = "close-button";

      closeButton.addEventListener("click", () => {
        summaryBox.remove();
      });

      const summaryText = document.createElement("div");
      summaryText.innerText = summary;
      // summaryText.style.cssText = "margin-top:3rem;color:black;font-size:20px;";
      summaryText.id = "summary-text";
      summaryBox.appendChild(summaryText);
      summaryBox.appendChild(closeButton);
      // document.body.appendChild(summaryBox);
      // shadow.appendChild(summaryBox);
      container.append(summaryBox);
    };

    const getSummaryUrl = (container) => {
      const url = window.location.href;
      chrome.runtime.sendMessage(
        { action: "summarizeURL", URL: url },
        (response) => {
          if (response && response.summary) {
            displaySummary(response.summary, container);
          } else if (response && response.error) {
            displaySummary(response.error, container);
          }
        }
      );
    };

    const getSummaryDoc = (container, file) => {
      // const reader = new FileReader();
      // reader.onload=()=>{
      //   const arrayBuffer = reader.result;
      //   console.log("Array Buffer = ",arrayBuffer);

      //   chrome.runtime.sendMessage(
      //     {action:"summarizeFile",file:{buffer:arrayBuffer,type:file.type,name:file.name}},
      //     (response)=>{
      //       console.log("response = ",response);
      //       if (response && response.summary) {
      //         displaySummary(response.summary, container);
      //       } else if (response && response.error) {
      //         displaySummary(response.error, container);
      //       }
      //     }
      //   )

      // }
      // reader.readAsArrayBuffer(file);
      chrome.runtime.sendMessage(
        { action: "summarizeFile", file: { pdfData: file } },
        (response) => {
          console.log(response);
        }
      );
    };

    const handleFormSubmit = async (event,container) => {
      event.preventDefault();
      // const container = document.getElementById('options');
      const inputFile = event.target.elements["docFile"].files[0];
      
      // const reader = new FileReader();
      // reader.addEventListener("load", () => {
      //   console.log("Base64:  ", typeof reader.result, reader.result);
        
      //   console.log("blobUrl : ",reader.result);
      // });
      const all_text = await extractTextFromPDF(inputFile);
      // console.log("PDF text: ",all_text);
      chrome.runtime.sendMessage(
        { action: "summarizeFile", all_text:  all_text},
        (response) => {
          if (response && response.summary) {
            displaySummary(response.summary, container);
          } else if (response && response.error) {
            displaySummary(response.error, container);
          }
        }
      );

      // reader.readAsDataURL(inputFile);
    };

    const createForm = (container) => {
      const form = document.createElement("form");
      form.enctype = "multipart/form-data";
      const input = document.createElement("input");
      input.type = "file";
      input.name = "docFile";
      input.id = "docFile";
      const buttonSubmit = document.createElement("button");

      buttonSubmit.type = "submit";
      buttonSubmit.innerText = "Summarize file";
      buttonSubmit.style.cssText = `padding:5px;`;

      buttonSubmit.addEventListener("click", (event) => {
        buttonSubmit.innerText = "Summarizing your file...";
        // getSummaryDoc(container);
      });
      form.appendChild(input);
      form.appendChild(buttonSubmit);
      form.addEventListener("submit", (event)=>{handleFormSubmit(event,container)});
      container.append(form);
    };

    const createCloseButton = (container) => {
      const closeButton = document.createElement("button");

      closeButton.id = "closeOptions";
      closeButton.innerText = "Close";

      closeButton.addEventListener("click", () => {
        container.remove();
      });

      container.append(closeButton);
    };

    const createSummarizeButton = (container) => {
      const summarizeButton = document.createElement("button");
      summarizeButton.innerText = "Sum up this webpage!";
      summarizeButton.id = "summarize-button";

      summarizeButton.addEventListener("click", () => {
        console.log("Button clicked");
        summarizeButton.innerText = "Summarizing...";
        getSummaryUrl(container);
        
      });

      container.append(summarizeButton);
    };

    const createOptionsBox = (container) => {
      const button = container.querySelector("#assistant-button");
      const optionsBox = document.createElement("div");
      optionsBox.id = "options";
      optionsBox.style.cssText = `top: ${
        button.offsetTop + button.offsetHeight + 10
      }px; right: ${
        window.innerWidth - button.offsetLeft - button.offsetWidth - 10
      }px;`;

      createForm(optionsBox);
      createCloseButton(optionsBox);
      createSummarizeButton(optionsBox);
      container.append(optionsBox);
    };

    const addAssist = (container) => {
      const exists = container.querySelector("#assistant-button");
      if (!exists) {
        const button = document.createElement("button");
        button.innerText = "Assistant";

        button.id = "assistant-button";

        container.append(button);

        button.addEventListener("mouseenter", () => {
          // button.innerText='Summarizing...';
          // getSummaryUrl(container);

          //start
          createOptionsBox(container);
        });
      }
    };
    const ui = await createShadowRootUi(ctx, {
      name: "example-ui",
      position: "inline",
      onMount(container) {
        // Define how your UI will be mounted inside the container
        // const exists = container.querySelector("#assistant-button");
        // if (!exists) {
        //   const button = document.createElement("button");
        //   button.innerText = "Assistant";

        //   button.id = "assistant-button";
        //   container.append(button);
        // }
        addAssist(container);
      },
    });

    // 4. Mount the UI
    ui.mount();

    const observer = new MutationObserver((changes) => {
      for (let change of changes) {
        if (change.type == "childList" && change.addedNodes.length) {
          addAssist(document.body);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initially add the button if not already present
    addAssist(document.body);
    console.log("Content running!");
  },
});
