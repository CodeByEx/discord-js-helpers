import { describe, it, expect } from 'vitest';
import { createClient, msg, btn, memoryCache } from '../src/index.js';

describe('djs-helper-kit', () => {
  describe('createClient', () => {
    it('should create a client with default options', () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(client.options.intents).toBeDefined();
    });

    it('should create a client with specific features', () => {
      const client = createClient({ features: ['commands', 'messages'] });
      expect(client).toBeDefined();
    });
  });

  describe('msg', () => {
    it('should create a message builder', () => {
      const ui = msg()
        .color(0x5865f2)
        .text('Test section')
        .footer('Test footer');
      
      expect(ui).toBeDefined();
      expect(typeof ui.color).toBe('function');
      expect(typeof ui.text).toBe('function');
    });

    it('should create message with actions', () => {
      const ui = msg()
        .text('Test')
        .buttons(btn.primary('test', 'Test Button')).build();
      
      expect(ui.components).toBeDefined();
      expect(ui.flags).toBeDefined();
    });
  });

  describe('btn', () => {
    it('should create primary button', () => {
      const button = btn.primary('test', 'Test Button');
      expect(button).toBeDefined();
      expect(typeof button.setCustomId).toBe('function');
      expect(typeof button.setLabel).toBe('function');
    });

    it('should create secondary button', () => {
      const button = btn.secondary('test', 'Test Button');
      expect(button).toBeDefined();
    });
  });

  describe('memoryCache', () => {
    it('should create cache instance', () => {
      const cache = memoryCache();
      expect(cache).toBeDefined();
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.set).toBe('function');
      expect(typeof cache.del).toBe('function');
    });

    it('should store and retrieve values', async () => {
      const cache = memoryCache();
      await cache.set('test', 'value', 60);
      const result = await cache.get('test');
      expect(result).toBe('value');
    });
  });
}); 