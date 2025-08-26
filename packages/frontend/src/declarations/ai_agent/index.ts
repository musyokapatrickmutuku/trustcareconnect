// Simple AI Agent declarations
export const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    'askAI': IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Text],
      []
    ),
    'healthCheck': IDL.Func([], [IDL.Text], [])
  });
};

export const init = ({ IDL }: any) => { return []; };