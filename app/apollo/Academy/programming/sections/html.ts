import {
  StudyDescription,
  QuizConfig,
  PracticePrompt,
  PracticeCheckResult,
} from "../lessonTypes";

export function getHtmlStudy(lessonCode: string): StudyDescription | null {
  switch (lessonCode) {
    case "2.1":
      return {
        title: "HTML Foundations: Skeleton of a Page",
        paragraphs: [
          "HTML is the skeleton of every web page. Before you think about colors or animations, you need a clear structure: where is the title, where is the content, where is the navigation.",
          "In this lesson, you focus on the basic structure: <!DOCTYPE html>, <html>, <head>, and <body>. This is the frame that every modern page still uses, including GAIA.",
          "You also see how headings (<h1>, <h2>, ...), paragraphs (<p>), and simple lists (<ul>, <li>) help you express the logical order of your content.",
          "The goal is not to write something beautiful yet. The goal is to write something that is clean, valid, and easy to read - for you and for GAIA.",
        ],
      };
    case "2.2":
      return {
        title: "Semantic HTML: Giving Meaning to Structure",
        paragraphs: [
          "Once you know the basic tags, the next step is semantics: using tags that describe the role of each part of your page.",
          "Instead of wrapping everything in <div>, you can use <header>, <nav>, <main>, <section>, <article>, <aside>, and <footer>. These tags tell a story about your page structure.",
          "Semantic HTML helps screen readers, search engines, and tools like GAIA understand your layout. It also helps future-you quickly see what is going on without reading every line.",
          "In this lesson, you look at a small page and practice choosing semantic tags that match the meaning of each block.",
        ],
      };
    case "2.3":
      return {
        title: "Links and Navigation: Connecting Your Pages",
        paragraphs: [
          "HTML pages become powerful when they are connected. Links let you move between sections of GAIA, between modules, and between completely different sites.",
          "The <a> tag (anchor) plus the href attribute creates a clickable link. The text inside <a> is what the user sees and clicks.",
          "You can link to external sites (like a YouTube video or Mahesh Hamadani tutorial) with full URLs starting with http or https. You can also link between GAIA pages using relative paths like /apollo/academy.",
          "In this lesson, you focus on building simple navigation links and understanding when to use absolute versus relative paths.",
        ],
      };
    case "2.4":
      return {
        title: "Images and Alt Text: Visuals with Meaning",
        paragraphs: [
          "Images are a big part of GAIA: logos, avatars, gallery items, thumbnails. The <img> tag lets you embed an image file into your page.",
          "Every <img> should have a src attribute (where the file lives) and an alt attribute (a short description of what the image is).",
          "Alt text is not decoration. It is how people using screen readers understand your page, and it also appears when images fail to load.",
          "In this lesson, you practice writing <img> tags with good alt text that clearly describes the image, especially for important UI elements like logos and icons.",
        ],
      };
    case "2.5":
      return {
        title: "HTML Forms: Collecting Data from Users",
        paragraphs: [
          "Forms are how users talk back to your app. In GAIA-style apps, forms will be used to add logs, update health metrics, save financial data, and more.",
          "A form is usually built from a <form> element containing <label> and <input> (or other fields like <textarea>, <select>, etc.).",
          "Labels should be clearly connected to inputs so users and screen readers know what each field is about.",
          "In this lesson, you build a tiny form, like a 'New GAIA note' or 'Daily summary' form, with proper labels and input types.",
        ],
      };
    default:
      return null;
  }
}

export function getHtmlQuiz(lessonCode: string): QuizConfig | null {
  switch (lessonCode) {
    case "2.1":
      return {
        id: "quiz-2-1",
        title: "Check your understanding of basic HTML structure",
        questions: [
          {
            id: "q1",
            prompt: "What is the correct order of the main HTML tags in a page?",
            options: [
              {
                id: "q1-a",
                label: "<html> inside <body> inside <head>",
              },
              {
                id: "q1-b",
                label: "<head> and <body> are siblings inside <html>",
              },
              {
                id: "q1-c",
                label: "<body> and <html> are inside <head>",
              },
              {
                id: "q1-d",
                label: "There is no required structure.",
              },
            ],
            correctOptionId: "q1-b",
            explanation:
              "The root is <html>, and inside it you have two main children: <head> and <body>.",
          },
          {
            id: "q2",
            prompt: "Which tag is the best for the main title of the page?",
            options: [
              { id: "q2-a", label: "<p>" },
              { id: "q2-b", label: "<h1>" },
              { id: "q2-c", label: "<div>" },
              { id: "q2-d", label: "<span>" },
            ],
            correctOptionId: "q2-b",
            explanation:
              "<h1> is the main heading of the page. It gives structure and helps screen readers and search engines understand the page.",
          },
          {
            id: "q3",
            prompt: "What is the purpose of the <head> element?",
            options: [
              {
                id: "q3-a",
                label: "To show visible content like text and images.",
              },
              {
                id: "q3-b",
                label:
                  "To contain metadata, title, and links to styles or scripts.",
              },
              {
                id: "q3-c",
                label: "To display the main navigation menu.",
              },
              {
                id: "q3-d",
                label: "It has no purpose, it is optional and unused.",
              },
            ],
            correctOptionId: "q3-b",
            explanation:
              "The <head> contains information about the document itself: title, meta tags, links to CSS, etc.",
          },
        ],
      };
    case "2.2":
      return {
        id: "quiz-2-2",
        title: "Check your understanding of semantic HTML",
        questions: [
          {
            id: "q1",
            prompt:
              "Which tag is most appropriate for the main navigation links of a site?",
            options: [
              { id: "q1-a", label: "<div>" },
              { id: "q1-b", label: "<nav>" },
              { id: "q1-c", label: "<section>" },
              { id: "q1-d", label: "<article>" },
            ],
            correctOptionId: "q1-b",
            explanation:
              "<nav> clearly tells the browser and assistive tech that this area holds navigation links.",
          },
          {
            id: "q2",
            prompt:
              "If you have a block of content that could stand alone (like a blog post), which tag is best?",
            options: [
              { id: "q2-a", label: "<article>" },
              { id: "q2-b", label: "<section>" },
              { id: "q2-c", label: "<aside>" },
              { id: "q2-d", label: "<span>" },
            ],
            correctOptionId: "q2-a",
            explanation:
              "<article> is for self-contained pieces of content that could be reused or syndicated.",
          },
          {
            id: "q3",
            prompt:
              "Why does semantic HTML matter for GAIA and for future-you?",
            options: [
              {
                id: "q3-a",
                label:
                  "It makes the code bigger and more complex, which is fun.",
              },
              {
                id: "q3-b",
                label:
                  "It makes the structure clearer, improves accessibility, and makes it easier for tools (and your brain) to understand pages.",
              },
              {
                id: "q3-c",
                label: "It is required or the browser will not render the page.",
              },
              {
                id: "q3-d",
                label: "It is only for SEO and does not affect you.",
              },
            ],
            correctOptionId: "q3-b",
            explanation:
              "Semantic HTML is about meaning. It makes your pages easier to maintain, extend, and connect into systems like GAIA.",
          },
        ],
      };
    case "2.3":
      return {
        id: "quiz-2-3",
        title: "Check your understanding of links and navigation",
        questions: [
          {
            id: "q1",
            prompt: "Which tag is used to create a hyperlink in HTML?",
            options: [
              { id: "q1-a", label: "<link>" },
              { id: "q1-b", label: "<a>" },
              { id: "q1-c", label: "<href>" },
              { id: "q1-d", label: "<nav>" },
            ],
            correctOptionId: "q1-b",
            explanation:
              "The <a> tag (anchor) is used to create hyperlinks. The href attribute tells the browser where the link goes.",
          },
          {
            id: "q2",
            prompt:
              "What is the purpose of the href attribute on an <a> tag?",
            options: [
              { id: "q2-a", label: "To set the hover color" },
              { id: "q2-b", label: "To specify the destination URL or path" },
              { id: "q2-c", label: "To make the text bold" },
              { id: "q2-d", label: "To change the font family" },
            ],
            correctOptionId: "q2-b",
            explanation:
              "href is short for 'hypertext reference'. It tells the browser where this link should take the user.",
          },
          {
            id: "q3",
            prompt:
              "Which is a good example of a relative link inside a GAIA-style project?",
            options: [
              { id: "q3-a", label: "<a href=\"https://gaia.com\">GAIA</a>" },
              {
                id: "q3-b",
                label: "<a href=\"/apollo/academy\">Academy</a>",
              },
              {
                id: "q3-c",
                label: "<a href=\"C:\\Users\\file.html\">File</a>",
              },
              {
                id: "q3-d",
                label: "<a href=\"mailto:sasa@example.com\">Mail</a>",
              },
            ],
            correctOptionId: "q3-b",
            explanation:
              "In a web app, /apollo/academy is a relative path on the same site. It is how you link between GAIA pages.",
          },
        ],
      };
    case "2.4":
      return {
        id: "quiz-2-4",
        title: "Check your understanding of images and alt text",
        questions: [
          {
            id: "q1",
            prompt: "Which tag is used to display an image in HTML?",
            options: [
              { id: "q1-a", label: "<image>" },
              { id: "q1-b", label: "<img>" },
              { id: "q1-c", label: "<pic>" },
              { id: "q1-d", label: "<src>" },
            ],
            correctOptionId: "q1-b",
            explanation:
              "The <img> tag is used to embed images. It is a self-closing tag that uses src and alt attributes.",
          },
          {
            id: "q2",
            prompt: "Why is the alt attribute important on <img>?",
            options: [
              { id: "q2-a", label: "It makes the image bigger" },
              { id: "q2-b", label: "It is required by the browser" },
              {
                id: "q2-c",
                label:
                  "It provides a text description for screen readers and when the image cannot load.",
              },
              { id: "q2-d", label: "It sets the file size of the image" },
            ],
            correctOptionId: "q2-c",
            explanation:
              "alt text is critical for accessibility. It tells people using screen readers what the image represents, and it appears when the image fails to load.",
          },
          {
            id: "q3",
            prompt:
              "Which of these is the best alt text for a GAIA logo image?",
            options: [
              { id: "q3-a", label: "image1234" },
              { id: "q3-b", label: "logo" },
              { id: "q3-c", label: "GAIA leaf logo" },
              { id: "q3-d", label: "" },
            ],
            correctOptionId: "q3-c",
            explanation:
              "Good alt text describes the content and purpose: 'GAIA leaf logo' is clear and specific without being too long.",
          },
        ],
      };
    case "2.5":
      return {
        id: "quiz-2-5",
        title: "Check your understanding of HTML forms",
        questions: [
          {
            id: "q1",
            prompt: "Which tag wraps a group of inputs that are submitted together?",
            options: [
              { id: "q1-a", label: "<input>" },
              { id: "q1-b", label: "<label>" },
              { id: "q1-c", label: "<form>" },
              { id: "q1-d", label: "<fieldset>" },
            ],
            correctOptionId: "q1-c",
            explanation:
              "<form> groups inputs together and defines where the data will be sent when the user submits.",
          },
          {
            id: "q2",
            prompt: "What is the main purpose of a <label> element?",
            options: [
              { id: "q2-a", label: "To display helper text inside an input" },
              {
                id: "q2-b",
                label:
                  "To provide a caption that is associated with a specific input field.",
              },
              { id: "q2-c", label: "To store the value of an input" },
              { id: "q2-d", label: "To submit the form" },
            ],
            correctOptionId: "q2-b",
            explanation:
              "A <label> is tied to an input by id/for or by wrapping. It makes forms easier to use, especially for screen readers.",
          },
          {
            id: "q3",
            prompt:
              "Which attribute on <input> defines what kind of data the field expects?",
            options: [
              { id: "q3-a", label: "name" },
              { id: "q3-b", label: "type" },
              { id: "q3-c", label: "value" },
              { id: "q3-d", label: "placeholder" },
            ],
            correctOptionId: "q3-b",
            explanation:
              "The type attribute (text, email, password, number, etc.) tells the browser how to treat and validate the input.",
          },
        ],
      };
    default:
      return null;
  }
}

export function getHtmlPractice(lessonCode: string): PracticePrompt | null {
  switch (lessonCode) {
    case "2.1":
      return {
        title: "Build a clean HTML skeleton",
        description:
          "Now you will write a complete, simple HTML page by hand. Focus on structure and correctness, not on design.",
        instructions: [
          "In the practice box below, write a full HTML document with <!DOCTYPE html>, <html>, <head>, and <body>. In <head>, include a <title> like \"GAIA - HTML Foundations\".",
          "Inside <body>, create a main <h1> heading, at least two <h2> subheadings, some <p> paragraphs, and one unordered list (<ul>) with 3-5 items.",
          "When you are done, click \"Check practice & mark lesson\". GAIA will quickly check if the required tags exist before it marks the lesson completed.",
          "Project pattern: First, build this page completely alone. Later, you can ask AI to review your HTML and suggest improvements for readability and structure.",
        ],
      };
    case "2.2":
      return {
        title: "Refactor a layout using semantic tags",
        description:
          "Here you will practice replacing generic containers with semantic HTML to make the structure clearer.",
        instructions: [
          "In the practice box below, write a simple layout that represents a page with header, navigation, main content area, and footer using semantic tags.",
          "Use <header>, <nav>, <main>, <section> or <article>, and <footer> at minimum.",
          "When you are done, click \"Check practice & mark lesson\". GAIA will check for these semantic tags before it marks the lesson completed.",
        ],
      };
    case "2.3":
      return {
        title: "Build a simple GAIA-style navigation",
        description:
          "Now you will practice creating real links that could exist inside GAIA, both internal and external.",
        instructions: [
          "In the practice box below, write a small HTML snippet for a navigation area with at least three links.",
          "Include at least one internal link (for example /apollo/academy or /health) and at least one external link (for example a YouTube tutorial).",
          "When you are done, click \"Check practice & mark lesson\". GAIA will check that you are actually using <a> tags with href attributes.",
        ],
      };
    case "2.4":
      return {
        title: "Embed images with meaningful alt text",
        description:
          "Here you will practice writing <img> tags that would make sense inside GAIA, with good alt text.",
        instructions: [
          "In the practice box below, write HTML that includes at least two <img> elements.",
          "Give each image a realistic src (you can use placeholder paths like /images/gaia-logo.png) and a clear alt description (for example \"GAIA leaf logo\").",
          "When you are done, click \"Check practice & mark lesson\". GAIA will check that you used <img> with alt attributes.",
        ],
      };
    case "2.5":
      return {
        title: "HTML mini project: GAIA daily note form",
        description:
          "This is the wrap-up mini project for the HTML arc. You will combine structure, semantics, links, and a simple form into one small GAIA-style page.",
        instructions: [
          "Build a full HTML page for a \"GAIA Daily Note\". Use <!DOCTYPE html>, <html>, <head>, and <body> with a clear <title>.",
          "In the body, create a semantic layout with <header>, <nav>, <main>, and <footer>. In the nav, include links like \"Health\", \"Wealth\", \"Academy\", etc.",
          "Inside <main>, add a form for a daily note with at least: a text input for a title, a textarea for the note, and maybe a select or radio buttons for mood.",
          "Add at least one image (for example a GAIA logo) with good alt text.",
          "Project pattern A (solo): Try to build this whole page alone without AI. Only check the docs if you completely forget a tag.",
          "Project pattern B (with AI): Later, ask AI to review your page and help you refactor it for better semantics and accessibility.",
        ],
      };
    default:
      return null;
  }
}

export function validateHtmlPractice(
  lessonCode: string,
  content: string
): PracticeCheckResult | null {
  const src = content.toLowerCase();

  if (lessonCode === "2.1") {
    const required = [
      "<!doctype html",
      "<html",
      "<head",
      "<body",
      "<h1",
      "<h2",
      "<ul",
      "<li",
    ];
    const missing = required.filter((snippet) => !src.includes(snippet));
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Your HTML skeleton is missing some required pieces: " +
          missing.join(", "),
      };
    }
    return { ok: true };
  }

  if (lessonCode === "2.2") {
    const required = ["<header", "<nav", "<main", "<footer"];
    const missing = required.filter((snippet) => !src.includes(snippet));
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Your semantic layout is missing some required tags: " +
          missing.join(", "),
      };
    }
    return { ok: true };
  }

  if (lessonCode === "2.3") {
    const required = ["<a", "href="];
    const missing = required.filter((snippet) => !src.includes(snippet));
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Your navigation is missing some required link pieces: " +
          missing.join(", "),
      };
    }
    return { ok: true };
  }

  if (lessonCode === "2.4") {
    const required = ["<img", "alt="];
    const missing = required.filter((snippet) => !src.includes(snippet));
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Your images are missing some required pieces: " +
          missing.join(", "),
      };
    }
    return { ok: true };
  }

  if (lessonCode === "2.5") {
    const required = ["<form", "<label", "<input"];
    const missing = required.filter((snippet) => !src.includes(snippet));
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Your GAIA Daily Note form is missing some required pieces: " +
          missing.join(", "),
      };
    }
    return { ok: true };
  }

  return null;
}
