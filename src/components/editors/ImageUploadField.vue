<template>
  <div class="image-upload-field" :class="{ compact }">
    <div v-if="modelValue" class="image-upload-preview">
      <img :src="modelValue" alt="uploaded preview" class="image-upload-preview-img" />
    </div>
    <a-space wrap>
      <a-upload
        accept="image/*"
        :show-upload-list="false"
        :before-upload="handleBeforeUpload"
      >
        <a-button>
          <UploadOutlined />
          {{ modelValue ? replaceText : buttonText }}
        </a-button>
      </a-upload>
      <a-button v-if="modelValue" danger @click="clearImage">删除图片</a-button>
    </a-space>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { UploadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

defineProps({
  modelValue: { type: String, default: '' },
  buttonText: { type: String, default: '上传图片' },
  replaceText: { type: String, default: '更换图片' },
  compact: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

async function handleBeforeUpload(file) {
  if (!file.type.startsWith('image/')) {
    message.error('请上传图片文件');
    return false;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    emit('update:modelValue', dataUrl);
  } catch (error) {
    message.error('图片读取失败，请重试');
  }

  return false;
}

function clearImage() {
  emit('update:modelValue', '');
}
</script>
