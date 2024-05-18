import "./style.css";
export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {


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


    const getSummaryDoc=(container,file)=>{
      chrome.runtime.sendMessage(
        {action:"summarizeFile",file:file},
        (response)=>{
          if (response && response.summary) {
            displaySummary(response.summary, container);
          } else if (response && response.error) {
            displaySummary(response.error, container);
          }
        }
      )
    }


    // const handleFormSubmit=(event)=>{
    //   event.preventDefault();
    //   const inputFile = event.target.elements['docFile'].files[0];
    //   console.log("file = ",inputFile);
    //   if(inputFile)
    //   {getSummaryDoc(container,inputFile);}
    //   else{
    //     console.log("Empty File!");
    //   }
    // }

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
      form.addEventListener('submit',(event)=>{
        event.preventDefault();
        const inputFile = event.target.elements['docFile'].files[0];
        console.log("file = ",inputFile);
        if(inputFile)
        {
          getSummaryDoc(container,inputFile);
        }
        else
        {
          console.log("Empty File!");
        }
      });
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


    const createSummarizeButton=(container)=>{
      const summarizeButton = document.createElement("button");
      summarizeButton.innerText = "Sum up this webpage!";
      summarizeButton.id = "summarize-button";


      summarizeButton.addEventListener("click", () => {
        console.log("Button clicked");
        summarizeButton.innerText = "Summarizing...";
        getSummaryUrl(container);
      });

      container.append(summarizeButton);
    }

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
