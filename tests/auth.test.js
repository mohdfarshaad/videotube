const sum = (a, b) => {
  return a + b;
};

test("Sum = 3", () => {
  expect(sum(1, 2)).toBe(3);
});
