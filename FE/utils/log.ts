export const log = (label: string, data: any, color: string = 'cyan') => {
  const styles: Record<string, string> = {
    red: 'color: red;',
    green: 'color: green;',
    blue: 'color: blue;',
    cyan: 'color: cyan;',
    yellow: 'color: orange;',
  };

  console.log(
    `%c[${new Date().toISOString()}] ${label}:`,
    styles[color] || '',
    data
  );
};