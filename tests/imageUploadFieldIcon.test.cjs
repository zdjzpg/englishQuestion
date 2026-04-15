const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('image upload field adds a delete icon before 删除图片 for compact visual consistency', () => {
  const source = read('src/components/editors/ImageUploadField.vue');

  assert.match(source, /DeleteOutlined,\s*UploadOutlined/);
  assert.match(source, /<a-button v-if="modelValue" danger @click="clearImage">[\s\S]*<DeleteOutlined \/>[\s\S]*删除图片/);
});
