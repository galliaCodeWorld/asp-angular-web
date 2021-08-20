export enum HttpStatusCodeEnum {
	name = "HttpStatusCodeEnum",
	//
	// Summary:
	//     Equivalent to HTTP status 100. System.Net.HttpStatusCode.Continue indicates that
	//     the client can continue with its request.
	continue = 100,
	//
	// Summary:
	//     Equivalent to HTTP status 101. System.Net.HttpStatusCode.SwitchingProtocols indicates
	//     that the protocol version or protocol is being changed.
	switchingProtocols = 101,
	//
	// Summary:
	//     Equivalent to HTTP status 200. System.Net.HttpStatusCode.OK indicates that the
	//     request succeeded and that the requested information is in the response. This
	//     is the most common status code to receive.
	ok = 200,
	//
	// Summary:
	//     Equivalent to HTTP status 201. System.Net.HttpStatusCode.Created indicates that
	//     the request resulted in a new resource created before the response was sent.
	created = 201,
	//
	// Summary:
	//     Equivalent to HTTP status 202. System.Net.HttpStatusCode.Accepted indicates that
	//     the request has been accepted for further processing.
	accepted = 202,
	//
	// Summary:
	//     Equivalent to HTTP status 203. System.Net.HttpStatusCode.NonAuthoritativeInformation
	//     indicates that the returned metainformation is from a cached copy instead of
	//     the origin server and therefore may be incorrect.
	nonAuthoritativeInformation = 203,
	//
	// Summary:
	//     Equivalent to HTTP status 204. System.Net.HttpStatusCode.NoContent indicates
	//     that the request has been successfully processed and that the response is intentionally
	//     blank.
	noContent = 204,
	//
	// Summary:
	//     Equivalent to HTTP status 205. System.Net.HttpStatusCode.ResetContent indicates
	//     that the client should reset (not reload) the current resource.
	resetContent = 205,
	//
	// Summary:
	//     Equivalent to HTTP status 206. System.Net.HttpStatusCode.PartialContent indicates
	//     that the response is a partial response as requested by a GET request that includes
	//     a byte range.
	partialContent = 206,
	//
	// Summary:
	//     Equivalent to HTTP status 300. System.Net.HttpStatusCode.MultipleChoices indicates
	//     that the requested information has multiple representations. The default action
	//     is to treat this status as a redirect and follow the contents of the Location
	//     header associated with this response.
	multipleChoices = 300,
	//
	// Summary:
	//     Equivalent to HTTP status 300. System.Net.HttpStatusCode.Ambiguous indicates
	//     that the requested information has multiple representations. The default action
	//     is to treat this status as a redirect and follow the contents of the Location
	//     header associated with this response.
	ambiguous = 300,
	//
	// Summary:
	//     Equivalent to HTTP status 301. System.Net.HttpStatusCode.MovedPermanently indicates
	//     that the requested information has been moved to the URI specified in the Location
	//     header. The default action when this status is received is to follow the Location
	//     header associated with the response.
	movedPermanently = 301,
	//
	// Summary:
	//     Equivalent to HTTP status 301. System.Net.HttpStatusCode.Moved indicates that
	//     the requested information has been moved to the URI specified in the Location
	//     header. The default action when this status is received is to follow the Location
	//     header associated with the response. When the original request method was POST,
	//     the redirected request will use the GET method.
	moved = 301,
	//
	// Summary:
	//     Equivalent to HTTP status 302. System.Net.HttpStatusCode.Found indicates that
	//     the requested information is located at the URI specified in the Location header.
	//     The default action when this status is received is to follow the Location header
	//     associated with the response. When the original request method was POST, the
	//     redirected request will use the GET method.
	found = 302,
	//
	// Summary:
	//     Equivalent to HTTP status 302. System.Net.HttpStatusCode.Redirect indicates that
	//     the requested information is located at the URI specified in the Location header.
	//     The default action when this status is received is to follow the Location header
	//     associated with the response. When the original request method was POST, the
	//     redirected request will use the GET method.
	redirect = 302,
	//
	// Summary:
	//     Equivalent to HTTP status 303. System.Net.HttpStatusCode.SeeOther automatically
	//     redirects the client to the URI specified in the Location header as the result
	//     of a POST. The request to the resource specified by the Location header will
	//     be made with a GET.
	seeOther = 303,
	//
	// Summary:
	//     Equivalent to HTTP status 303. System.Net.HttpStatusCode.RedirectMethod automatically
	//     redirects the client to the URI specified in the Location header as the result
	//     of a POST. The request to the resource specified by the Location header will
	//     be made with a GET.
	redirectMethod = 303,
	//
	// Summary:
	//     Equivalent to HTTP status 304. System.Net.HttpStatusCode.NotModified indicates
	//     that the client's cached copy is up to date. The contents of the resource are
	//     not transferred.
	notModified = 304,
	//
	// Summary:
	//     Equivalent to HTTP status 305. System.Net.HttpStatusCode.UseProxy indicates that
	//     the request should use the proxy server at the URI specified in the Location
	//     header.
	useProxy = 305,
	//
	// Summary:
	//     Equivalent to HTTP status 306. System.Net.HttpStatusCode.Unused is a proposed
	//     extension to the HTTP/1.1 specification that is not fully specified.
	unused = 306,
	//
	// Summary:
	//     Equivalent to HTTP status 307. System.Net.HttpStatusCode.TemporaryRedirect indicates
	//     that the request information is located at the URI specified in the Location
	//     header. The default action when this status is received is to follow the Location
	//     header associated with the response. When the original request method was POST,
	//     the redirected request will also use the POST method.
	temporaryRedirect = 307,
	//
	// Summary:
	//     Equivalent to HTTP status 307. System.Net.HttpStatusCode.RedirectKeepVerb indicates
	//     that the request information is located at the URI specified in the Location
	//     header. The default action when this status is received is to follow the Location
	//     header associated with the response. When the original request method was POST,
	//     the redirected request will also use the POST method.
	redirectKeepVerb = 307,
	//
	// Summary:
	//     Equivalent to HTTP status 400. System.Net.HttpStatusCode.BadRequest indicates
	//     that the request could not be understood by the server. System.Net.HttpStatusCode.BadRequest
	//     is sent when no other error is applicable, or if the exact error is unknown or
	//     does not have its own error code.
	badRequest = 400,
	//
	// Summary:
	//     Equivalent to HTTP status 401. System.Net.HttpStatusCode.Unauthorized indicates
	//     that the requested resource requires authentication. The WWW-Authenticate header
	//     contains the details of how to perform the authentication.
	unauthorized = 401,
	//
	// Summary:
	//     Equivalent to HTTP status 402. System.Net.HttpStatusCode.PaymentRequired is reserved
	//     for future use.
	paymentRequired = 402,
	//
	// Summary:
	//     Equivalent to HTTP status 403. System.Net.HttpStatusCode.Forbidden indicates
	//     that the server refuses to fulfill the request.
	forbidden = 403,
	//
	// Summary:
	//     Equivalent to HTTP status 404. System.Net.HttpStatusCode.NotFound indicates that
	//     the requested resource does not exist on the server.
	notFound = 404,
	//
	// Summary:
	//     Equivalent to HTTP status 405. System.Net.HttpStatusCode.MethodNotAllowed indicates
	//     that the request method (POST or GET) is not allowed on the requested resource.
	methodNotAllowed = 405,
	//
	// Summary:
	//     Equivalent to HTTP status 406. System.Net.HttpStatusCode.NotAcceptable indicates
	//     that the client has indicated with Accept headers that it will not accept any
	//     of the available representations of the resource.
	notAcceptable = 406,
	//
	// Summary:
	//     Equivalent to HTTP status 407. System.Net.HttpStatusCode.ProxyAuthenticationRequired
	//     indicates that the requested proxy requires authentication. The Proxy-authenticate
	//     header contains the details of how to perform the authentication.
	proxyAuthenticationRequired = 407,
	//
	// Summary:
	//     Equivalent to HTTP status 408. System.Net.HttpStatusCode.RequestTimeout indicates
	//     that the client did not send a request within the time the server was expecting
	//     the request.
	requestTimeout = 408,
	//
	// Summary:
	//     Equivalent to HTTP status 409. System.Net.HttpStatusCode.Conflict indicates that
	//     the request could not be carried out because of a conflict on the server.
	conflict = 409,
	//
	// Summary:
	//     Equivalent to HTTP status 410. System.Net.HttpStatusCode.Gone indicates that
	//     the requested resource is no longer available.
	gone = 410,
	//
	// Summary:
	//     Equivalent to HTTP status 411. System.Net.HttpStatusCode.LengthRequired indicates
	//     that the required Content-length header is missing.
	lengthRequired = 411,
	//
	// Summary:
	//     Equivalent to HTTP status 412. System.Net.HttpStatusCode.PreconditionFailed indicates
	//     that a condition set for this request failed, and the request cannot be carried
	//     out. Conditions are set with conditional request headers like If-Match, If-None-Match,
	//     or If-Unmodified-Since.
	preconditionFailed = 412,
	//
	// Summary:
	//     Equivalent to HTTP status 413. System.Net.HttpStatusCode.RequestEntityTooLarge
	//     indicates that the request is too large for the server to process.
	requestEntityTooLarge = 413,
	//
	// Summary:
	//     Equivalent to HTTP status 414. System.Net.HttpStatusCode.RequestUriTooLong indicates
	//     that the URI is too long.
	requestUriTooLong = 414,
	//
	// Summary:
	//     Equivalent to HTTP status 415. System.Net.HttpStatusCode.UnsupportedMediaType
	//     indicates that the request is an unsupported type.
	UnsupportedMediaType = 415,
	//
	// Summary:
	//     Equivalent to HTTP status 416. System.Net.HttpStatusCode.RequestedRangeNotSatisfiable
	//     indicates that the range of data requested from the resource cannot be returned,
	//     either because the beginning of the range is before the beginning of the resource,
	//     or the end of the range is after the end of the resource.
	requestedRangeNotSatisfiable = 416,
	//
	// Summary:
	//     Equivalent to HTTP status 417. System.Net.HttpStatusCode.ExpectationFailed indicates
	//     that an expectation given in an Expect header could not be met by the server.
	expectationFailed = 417,
	//
	// Summary:
	//     Equivalent to HTTP status 426. System.Net.HttpStatusCode.UpgradeRequired indicates
	//     that the client should switch to a different protocol such as TLS/1.0.
	upgradeRequired = 426,
	//
	// Summary:
	//     Equivalent to HTTP status 500. System.Net.HttpStatusCode.InternalServerError
	//     indicates that a generic error has occurred on the server.
	internalServerError = 500,
	//
	// Summary:
	//     Equivalent to HTTP status 501. System.Net.HttpStatusCode.NotImplemented indicates
	//     that the server does not support the requested function.
	notImplemented = 501,
	//
	// Summary:
	//     Equivalent to HTTP status 502. System.Net.HttpStatusCode.BadGateway indicates
	//     that an intermediate proxy server received a bad response from another proxy
	//     or the origin server.
	badGateway = 502,
	//
	// Summary:
	//     Equivalent to HTTP status 503. System.Net.HttpStatusCode.ServiceUnavailable indicates
	//     that the server is temporarily unavailable, usually due to high load or maintenance.
	serviceUnavailable = 503,
	//
	// Summary:
	//     Equivalent to HTTP status 504. System.Net.HttpStatusCode.GatewayTimeout indicates
	//     that an intermediate proxy server timed out while waiting for a response from
	//     another proxy or the origin server.
	gatewayTimeout = 504,
	//
	// Summary:
	//     Equivalent to HTTP status 505. System.Net.HttpStatusCode.HttpVersionNotSupported
	//     indicates that the requested HTTP version is not supported by the server.
	httpVersionNotSupported = 505
}