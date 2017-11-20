import * as Chai from "chai";
import * as dust from "dustjs-linkedin";
import { ITemplate, ITemplateLoader, Template } from "lambda-framework";
import { stub, SinonStub } from "sinon";
import DustTemplateRenderer from "./../src/lib/DustTemplateRenderer";

/**
 * Test for DustTemplateRenderer.
 */
describe("DustTemplateRenderer", () => {
  const templateLoaderStub: SinonStub = stub();
  const templateLoader = { load: templateLoaderStub };

  beforeEach(() => {
    dust.debugLevel = "NONE";
    templateLoaderStub.callsFake((fileName: string, callback: (error: Error, template: ITemplate) => void) => {
      const template: ITemplate = new Template(fileName, fileName);
      callback(null, template);
    });
  });

  afterEach(() => {
    templateLoaderStub.reset();
  });

  it("should set dust debugLevel to \"INFO\" if isDev is indicated in the constructor options and it is true.", () => {
    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader, {isDev: true});
    Chai.expect(dust.debugLevel).to.be.equal("INFO");
  });

  it("should NOT set dust debugLevel to \"INFO\" if isDev is indicated in the constructor options and it is false.", () => {
    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader, {isDev: false});
    Chai.expect(dust.debugLevel).to.be.not.equal("INFO");
  });

  it("should set dust debugLevel to \"INFO\" if isDev is NOT indicated in the constructor options and NODE_ENV is NOT \"production\".", () => {
    process.env.NODE_ENV = "development";
    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
    Chai.expect(dust.debugLevel).to.be.equal("INFO");
  });

  it("should NOT set dust debugLevel to \"INFO\" if isDev is NOT indicated in the constructor options and NODE_ENV is \"production\".", () => {
    process.env.NODE_ENV = "production";
    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
    Chai.expect(dust.debugLevel).to.be.not.equal("INFO");
  });

  it("should set the dust `onLoad` function to a function that add the file extension to the fileName, call the template loader and call the param callback with the result of the template loader.", (done) => {
    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
    dust.onLoad("fileName", {}, (err: Error, content: string) => {
      Chai.expect(templateLoaderStub.calledOnce);
      Chai.expect(content).to.be.equal("fileName.dust");
      Chai.expect(err).to.be.null;
      done();
    });
  });

  it("should set the dust `onLoad` function to a function that call the param callback with an error if there is an error in the template loader.", (done) => {
    const error = new Error("Test");
    templateLoaderStub.callsFake((fileName: string, callback: (error: Error, template: ITemplate) => void) => {
      callback(error, null);
    });

    const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
    dust.onLoad("fileName", {}, (err: Error, content: string) => {
      Chai.expect(templateLoaderStub.calledOnce);
      Chai.expect(err).to.be.equal(error);
      Chai.expect(content).to.be.null;
      done();
    });
  });

  describe("#render", () => {
    it("should add the default .dust extension to fileName if no one is indicated in the constructor options.", (done) => {
      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(content).to.be.equal("fileName.dust");
        done();
      });
    });

    it("should NOT add the default .dust extension to fileName if the file name has it.", (done) => {
      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName.dust", {}, {}, (err: Error, content: string) => {
        Chai.expect(content).to.be.equal("fileName.dust");
        done();
      });
    });

    it("should add the indicated extension in the constructor options to fileName.", (done) => {
      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader, {extension: "html"});
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(content).to.be.equal("fileName.html");
        done();
      });
    });

    it("should load the file with the template loader.", (done) => {
      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(templateLoaderStub.calledOnce).to.be.true;
        done();
      });
    });

    it("should call the callback param with an error if there is some one calling the template loader.", (done) => {
      const error = new Error("Test");
      templateLoaderStub.callsFake((fileName: string, callback: (error: Error, template: ITemplate) => void) => {
        callback(error, null);
      });

      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(err).to.be.equal(error);
        done();
      });
    });

    it("should render the file content with dust and call the callback param.", (done) => {
      const stubDustCompile = stub(dust, "compile");
      stubDustCompile.returns("TEST COMPILE");
      const stubDustLoadSource = stub(dust, "loadSource");
      const stubDustRender = stub(dust, "render");
      stubDustRender.callsFake((template, params, callback) => {
        callback(null, "TEST RENDER");
      });

      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(stubDustCompile.calledOnce).to.be.true;
        Chai.expect(stubDustLoadSource.calledOnce).to.be.true;
        Chai.expect(stubDustLoadSource.args[0][0]).to.be.equal("TEST COMPILE");
        Chai.expect(stubDustRender.calledOnce).to.be.true;
        Chai.expect(content).to.be.equal("TEST RENDER");

        stubDustCompile.restore();
        stubDustLoadSource.restore();
        stubDustRender.restore();

        done();
      });
    });

    it("should call the callback param with an exception if there is one calling the dust render function.", (done) => {
      const error = new Error("Test error.");
      const stubDustCompile = stub(dust, "compile");
      stubDustCompile.throws(error);

      const templateRenderer: DustTemplateRenderer = new DustTemplateRenderer(templateLoader as any as ITemplateLoader);
      templateRenderer.render("fileName", {}, {}, (err: Error, content: string) => {
        Chai.expect(err).to.be.equal(error);
        Chai.expect(content).to.be.null;

        stubDustCompile.restore();

        done();
      });
    });
  });

});
