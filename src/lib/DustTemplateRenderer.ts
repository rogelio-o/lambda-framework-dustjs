import "dustjs-helpers";
import * as dust from "dustjs-linkedin";
import { ITemplate, ITemplateLoader, ITemplateRenderer } from "lambda-framework";
import IDustTemplateRendererOptions from "./IDustTemplateRendererOptions";

/**
 * Render a template with the given template loader and dust template engine.
 */
export default class DustTemplateRenderer implements ITemplateRenderer {

  private _templateLoader: ITemplateLoader;
  private _extension: string;

  constructor(templateLoader: ITemplateLoader, opts?: IDustTemplateRendererOptions) {
    const options: {[name: string]: any} = opts || {};
    const isDev = options.isDev === undefined ? process.env.NODE_ENV !== "production" : options.isDev;
    if (isDev) {
      dust.debugLevel = "INFO";
    }
    this._templateLoader = templateLoader;

    this._extension = options.extension || "dust";

    dust.onLoad = (templateName: string, params: {[name: string]: any}, callback: (error: Error, content: string) => void) => {
      templateName = this.addExtension(templateName);
      this._templateLoader.load(templateName, (err: Error, template: ITemplate) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, template.content);
        }
      });
    };
  }

  public render(fileName: string, params: {[name: string]: any}, engineConfig: {[name: string]: any}, callback: (error: Error, content: string) => void): void {
    fileName = this.addExtension(fileName);
    this._templateLoader.load(fileName, (err: Error, template: ITemplate) => {
      if (err) {
        callback(err, null);
      } else {
        try {
          const compiled: string = dust.compile(template.content, template.fileName);
          dust.loadSource(compiled);
          dust.render(template.fileName, params, callback);
        } catch (e) {
          callback(e, null);
        }
      }
    });
  }

  private addExtension(fileName: string): string {
    if (!fileName.endsWith(this._extension)) {
      return fileName + "." + this._extension;
    } else {
      return fileName;
    }
  }

}
