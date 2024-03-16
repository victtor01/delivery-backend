const SECRET_KEY: string = `${process.env.SECRET_KEY}`;
const SECRET_KEY_CLIENT: string = `${process.env.SECRET_KEY_CLIENT}`

const PORT: number = parseInt(`${process.env.PORT || 3000}`);

export { SECRET_KEY, PORT };
