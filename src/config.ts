const SECRET_KEY: string = `${process.env.SECRET_KEY}`;

const PORT: number = parseInt(`${process.env.PORT || 3000}`);

export { SECRET_KEY, PORT };
