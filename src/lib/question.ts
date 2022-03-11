import inquirer from "inquirer";

let exports: any = {};

const askQuestion = async (
  message: string,
  validate: string,
  fail: string,
  hidden: boolean
) => {
  const question: any = {
    name: "answer",
    type: hidden ? "password" : "input",
    message: message,
    validate: (value: string) => {
      if (value.match(validate)) {
        return true;
      } else {
        return fail;
      }
    },
  };

  return inquirer.prompt(question);
};

exports.askQuestion = askQuestion;

const YorN = async (message: string) => {
  const question = [
    {
      type: "confirm",
      name: "answer",
      message: message,
    },
  ];

  return inquirer.prompt(question);
};

exports.YorN = YorN;

const checkBox = async (message: string, array: Array<string>) => {
  const question = [
    {
      type: "checkbox",
      name: "answer",
      message: message,
      choices: array,
    },
  ];

  return inquirer.prompt(question);
};

exports.checkBox = checkBox;

const pickList = async (message: string, array: Array<String>) => {
  const question = [
    {
      type: "list",
      name: "answer",
      message: message,
      choices: array,
    },
  ];

  return inquirer.prompt(question);
};

exports.pickList = pickList;

export default exports;
