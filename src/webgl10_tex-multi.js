"use strict";
const SRC_VERT_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord0;
attribute vec2 aTexCoord1;
varying vec2 v_TexCoord0;
varying vec2 v_TexCoord1;
uniform mat4 MVP;
void main()
{
    gl_Position = MVP * vec4(aPosition, 0, 1);
    v_TexCoord0 = aTexCoord0;
    v_TexCoord1 = aTexCoord1;
}
`;

const SRC_FRAG_SHADER =
`
#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
varying vec2 v_TexCoord0;
varying vec2 v_TexCoord1;
void main()
{
    vec4 color0 = texture2D(u_Sampler0, v_TexCoord0);
    vec4 color1 = texture2D(u_Sampler1, v_TexCoord1);
    gl_FragColor = mix(color0, color1, 0.5);
}
`;

function main()
{
	let canvas = document.getElementById('webgl');
	let gl = getWebGLContext(canvas);

	let shader = init_shader(gl,
		SRC_VERT_SHADER, SRC_FRAG_SHADER,
		["aPosition", "aTexCoord0", "aTexCoord1"]);
	let obj = initVBO(gl);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	let textures = [{texture:null, unit:3, image:new Image(), loaded:false},
					{texture:null, unit:5, image:new Image(), loaded:false}];

	let MVP = new Matrix4();

	let tick_init = function() {
		if(textures[0].loaded && textures[1].loaded)
		{
			requestAnimationFrame(tick, canvas); // Request that the browser calls tick
		}
		else
		{
			requestAnimationFrame(tick_init, canvas); // Request that the browser calls tick
		}
	};

	shader.set_uniforms = function(gl) 
	{
		for(let i in textures)
		{
			gl.activeTexture(gl.TEXTURE0 + textures[i].unit);
			gl.bindTexture(gl.TEXTURE_2D, textures[i].texture);
			gl.uniform1i(gl.getUniformLocation(shader.h_prog, "u_Sampler" + i), textures[i].unit);
		}
		gl.uniformMatrix4fv(gl.getUniformLocation(shader.h_prog, "MVP"), false, MVP.elements);
	};

	let t_last = Date.now();
	const ANGLE_STEP = 45;

	let tick = function() {
		let now = Date.now();
		let elapsed = now - t_last;
		t_last = now;

		MVP.rotate(( (ANGLE_STEP * elapsed) / 1000.0) % 360.0, 0, 0, 1);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		render_object(gl, shader, obj);
		requestAnimationFrame(tick, canvas); // Request that the browser calls tick
	};

	for(let tex of textures)
	{
		tex.image.onload = function()
		{
			init_texture(gl, tex);
			tex.loaded = true;
		};
	}
	textures[0].image.src = '../resources/sky.jpg';
	textures[1].image.src = '../resources/circle.gif';

	tick_init();

}

function init_shader(gl, src_vert, src_frag, attrib_names)
{
	initShaders(gl, src_vert, src_frag);
	let h_prog = gl.program;
	let attribs = {};
	for(let attrib of attrib_names)
	{
		attribs[attrib] = gl.getAttribLocation(h_prog, attrib);
	}
	return {h_prog:h_prog, attribs:attribs};
}


function render_object(gl, shader, object)
{
	gl.useProgram(shader.h_prog);
	shader.set_uniforms(gl);

	for(let attrib_name in shader.attribs)
	{
		let	attrib = object.attribs[attrib_name];
		gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
		gl.vertexAttribPointer(shader.attribs[attrib_name], attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.enableVertexAttribArray(shader.attribs[attrib_name]);
	}
	if(object.drawcall == "drawArrays")
	{
		gl.drawArrays(object.type, 0, object.n);
	}
	else if(object.drawcall == "drawElements")
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.buf_index);
		gl.drawElements(object.type, object.n, object.type_index, 0);
	}

	for(let attrib_name in object.attribs)
	{
		gl.disableVertexAttribArray(shader.attribs[attrib_name]);
	}

	gl.useProgram(null);
}


function initVBO(gl)
{
	let verts = new Float32Array([
		-0.5,  0.5,   0, 1,  -1,  2,
		-0.5, -0.5,   0, 0,  -1, -1,
		 0.5,  0.5,   1, 1,   2,  2,
		 0.5, -0.5,   1, 0,   2, -1
	]);
	let buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
	
	let FSIZE = verts.BYTES_PER_ELEMENT;

	let	attribs = [];
	attribs["aPosition"] = {buffer:buf, size:2, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:0};
	attribs["aTexCoord0"] = {buffer:buf, size:2, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:FSIZE*2};
	attribs["aTexCoord1"] = {buffer:buf, size:2, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:FSIZE*4};

	return {n:4, drawcall:"drawArrays", type:gl.TRIANGLE_STRIP, attribs:attribs};
}


function init_texture(gl, tex)
{
	tex.texture = gl.createTexture(); 
	gl.bindTexture(gl.TEXTURE_2D, tex.texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);// Flip the image's y-axis
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
	return true;
}


