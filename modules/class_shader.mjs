
export class Shader
{
    // TODO: remove <uniform_vars> parameter (2020/11/27)
    constructor(gl, src_vert, src_frag, uniform_vars=undefined)
    {
        this.h_prog = createProgram(gl, src_vert, src_frag);
        if(!this.h_prog)    return;
        if(uniform_vars)
        {
            this.loc_uniforms = {};
            for(let uniform of uniform_vars)
            {
                this.loc_uniforms[uniform] = gl.getUniformLocation(this.h_prog, uniform);
            }
        }
        else
        {
            let num_uniforms = gl.getProgramParameter(this.h_prog, gl.ACTIVE_UNIFORMS);
            this.loc_uniforms = {};
            let uniform_info;
            for(let i=0 ; i<num_uniforms ; i++) {
                uniform_info = gl.getActiveUniform(this.h_prog, i);
                this.loc_uniforms[uniform_info.name] = gl.getUniformLocation(this.h_prog, uniform_info.name);
            }
        }

        function createProgram(gl, src_vert, src_frag)
        {
            let h_vert = compileShader(gl, gl.VERTEX_SHADER, src_vert);
            var h_frag = compileShader(gl, gl.FRAGMENT_SHADER, src_frag);
            if(!h_vert || !h_frag) return null;
            
            let h_prog = gl.createProgram();
            if(!h_prog)   return null;
            
            gl.attachShader(h_prog, h_vert);
            gl.attachShader(h_prog, h_frag);
            gl.linkProgram(h_prog);
            
            let status = gl.getProgramParameter(h_prog, gl.LINK_STATUS);
            if(!status)
            {
                let err = gl.getProgramInfoLog(h_prog);
                console.log(`Link Error: ${err}`);
                gl.deleteProgram(h_prog);
                gl.deleteShader(h_vert);
                gl.deleteShader(h_frag);
                return null;
            }
            return h_prog;
        }
    
        function compileShader(gl, type, src)
        {
            let shader = gl.createShader(type);
            if(!shader)
            {
                console.log('Compile Error: Failed to create a shader.');
                return null;
            }
            
            gl.shaderSource(shader, src);
            
            gl.compileShader(shader);
            
            let status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if(!status)
            {
                let err = gl.getShaderInfoLog(shader);
                console.log(`Compilation Error: ${err}`);
                gl.deleteShader(shader);
                return null;
            }
            
            return shader;
        }

    }

}


