import { getLocal } from "../..";
import { expect, fetch, URLSearchParams, Headers } from "../test-utils";

describe("HTTP request spying", function () {

    describe("using default settings", () => {
        let server = getLocal();

        beforeEach(() => server.start());
        afterEach(() => server.stop());

        it("should show no request details initially", async () => {
            const endpointMock = await server.get("/mocked-endpoint").thenReply(200, "mocked data");

            const seenRequests = await endpointMock.getSeenRequests();
            expect(seenRequests).to.deep.equal([]);
        });

        it("should let you spy on the urls of requests that happened", async () => {
            const endpointMock = await server.get("/mocked-endpoint").thenReply(200, "mocked data");

            await fetch(server.urlFor("/mocked-endpoint"));

            const seenRequests = await endpointMock.getSeenRequests();
            expect(seenRequests.length).to.equal(1);
            expect(seenRequests[0].url).to.equal(`http://localhost:${server.port}/mocked-endpoint`);
        });

        it("should let you spy on the bodies of requests that happened", async () => {
            const endpointMock = await server.post("/mocked-endpoint")
            .withForm({ a: '1', b: '2' })
            .thenReply(200, "mocked data");

            let form = new URLSearchParams();
            form.set('a', '1');
            form.set('b', '2');
            await fetch(server.urlFor("/mocked-endpoint"), {
                method: 'POST',
                headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
                }),
                body: form
            });

            const seenRequests = await endpointMock.getSeenRequests();
            expect(seenRequests.length).to.equal(1);
            expect(await seenRequests[0].body.getText()).to.equal("a=1&b=2");
        });

        it("should let you spy on incoming requests even if handling throws an error", async () => {
            const endpointMock = await server.get("/mocked-endpoint").thenCloseConnection();

            await fetch(server.urlFor("/mocked-endpoint")).catch(() => {});

            const seenRequests = await endpointMock.getSeenRequests();
            expect(seenRequests.length).to.equal(1);
            expect(seenRequests[0].url).to.equal(`http://localhost:${server.port}/mocked-endpoint`);
        });

        it("should return immutable fixed view of the mock's seen requests so far", async () => {
            const endpointMock = await server.get("/mocked-endpoint").thenReply(200, "mocked data");

            const seenRequests = await endpointMock.getSeenRequests();

            await fetch(server.urlFor("/mocked-endpoint"));

            expect(seenRequests).to.deep.equal([]);
        });
    });

    describe("with traffic recording disabled", () => {
        let server = getLocal({
            recordTraffic: false
        });

        beforeEach(() => server.start());
        afterEach(() => server.stop());

        it("should not record the requests that have been sent", async () => {
            const endpointMock = await server.get("/mocked-endpoint").thenReply(200, "mocked data");

            await fetch(server.urlFor("/mocked-endpoint"));

            const seenRequests = await endpointMock.getSeenRequests();
            expect(seenRequests.length).to.equal(0);
        });
    });
});
