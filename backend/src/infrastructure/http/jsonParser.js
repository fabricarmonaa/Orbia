export async function jsonParser(context) {
  if (!context.rawBody) {
    context.body = {};
    return;
  }
  try {
    context.body = context.rawBody ? JSON.parse(context.rawBody || '{}') : {};
  } catch (error) {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 });
  }
}
