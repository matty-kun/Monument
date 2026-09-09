import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
  validateStoragePath,
  validateStorageTarget,
} from "../src/utils/storagePolicy.ts";

test("storage policy accepts only known image targets and safe image files", () => {
  assert.equal(validateStorageTarget("department-images", "departments"), null);
  assert.match(validateStorageTarget("private", "departments"), /not allowed/);
  assert.match(validateStorageTarget("event-images", "../events"), /not allowed/);

  assert.equal(validateImageFile({ type: "image/webp", size: 1024 }), null);
  assert.match(validateImageFile({ type: "image/svg+xml", size: 1024 }), /JPEG/);
  assert.match(validateImageFile({ type: "image/png", size: MAX_IMAGE_SIZE_BYTES + 1 }), /5 MB/);

  assert.equal(validateStoragePath("event-images", "events/image.webp"), null);
  assert.match(validateStoragePath("event-images", "events/nested/image.webp"), /not allowed/);
});
