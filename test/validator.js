'use strict';

const Code = require('@hapi/code');
const Hoek = require('@hapi/hoek');
const Joi = require('..');
const Lab = require('@hapi/lab');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Validator', () => {

    describe('externals()', () => {

        it('executes externals on object child', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.object({
                id: Joi.string().external(check).external(append)
            });

            expect(await schema.validate({ id: 'valid' }, { externals: true })).to.equal({ id: 'verified!' });
            expect(await schema.validate({ id: 'skip' }, { externals: true })).to.equal({ id: 'skip!' });
        });

        it('executes externals on nested object child', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                if (id === 'unchanged') {
                    return id;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.object({
                user: {
                    id: Joi.string().external(check).external(append)
                }
            });

            expect(await schema.validate({ user: { id: 'valid' } }, { externals: true })).to.equal({ user: { id: 'verified!' } });
            expect(await schema.validate({ user: { id: 'skip' } }, { externals: true })).to.equal({ user: { id: 'skip!' } });
            expect(await schema.validate({ user: { id: 'unchanged' } }, { externals: true })).to.equal({ user: { id: 'unchanged!' } });
            await expect(schema.validate({ user: { id: 'other' } }, { externals: true })).to.reject('Invalid id (user.id)');
        });

        it('executes externals on root', async () => {

            const check = async (id) => {

                await Hoek.wait();
                if (id === 'valid') {
                    return 'verified';
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.string().external(check).external(append);

            const result = await schema.validate('valid', { externals: true });
            expect(result).to.equal('verified!');
        });

        it('executes externals on array item', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.array().items(Joi.string().external(check).external(append));

            expect(await schema.validate(['valid'], { externals: true })).to.equal(['verified!']);
            expect(await schema.validate(['skip'], { externals: true })).to.equal(['skip!']);
        });

        it('skips externals when prefs is false', async () => {

            const check = (id) => {

                throw new Error('Invalid id');
            };

            const schema = Joi.object({
                id: Joi.string().external(check)
            });

            await expect(schema.validate({ id: 'valid' }, { externals: true })).to.reject('Invalid id (id)');
            await expect(schema.validate({ id: 'valid' }, { externals: false })).to.not.reject();
            expect(() => schema.validate({ id: 'valid' })).to.throw('Cannot validate a schema with external rules without the externals flag');
        });

        it('supports describe', () => {

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.string().external(append);
            const description = schema.describe();
            expect(description).to.equal({ type: 'string', invalids: [''], externals: [{ method: append }] });
        });

        it('skips when used to match', async () => {

            let called = false;
            const check = () => {

                called = true;
            };

            const schema = Joi.array().has(Joi.string().external(check));

            const result = await schema.validate(['valid'], { externals: true });
            expect(result).to.equal(['valid']);
            expect(called).to.be.false();
        });
    });
});
